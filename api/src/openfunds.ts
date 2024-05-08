/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import * as ExcelJS from "exceljs";
import * as util from "util";
import { write, writeToBuffer } from "@fast-csv/format";
import { parseString } from "@fast-csv/parse";

import { validatePubkey } from "./validation";

const openfundsKeyFromField = (f) => {
  const words = f.field.replace("-", "").split(" ");
  return [words[0].toLowerCase(), ...words.splice(1)].join("");
};

const openfundsGetTemplate = async (template) => {
  // https://docs.google.com/spreadsheets/d/1PQFTn1iV90OkZqzdvwaOgTceltGnsEJxuxiCTdo_5Yo/edit#gid=0
  const templateUrl =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSH59SKOZv_mrXjfBUKCqK75sGj-yIXSLOkw4MMMnxMVSCZFodvOTfvTIRrymeMAOG2EBTnG5eN_ImV/pub?output=csv";
  const res = await fetch(templateUrl);

  const templateCsv = await new Promise(async (resolve, reject) => {
    let templateCsv = [];
    parseString(await res.text())
      .on("data", (row) => {
        templateCsv.push(row);
      })
      .on("end", (rowCount: number) => {
        resolve(templateCsv);
      });
  });
  const codes = templateCsv[0].slice(1).filter((x) => !!x);
  const fields = templateCsv[1].slice(1).filter((x) => !!x);
  const tags = templateCsv[2].slice(1).filter((x) => !!x);
  const templates = templateCsv[3].slice(1).filter((x) => !!x);
  const templateMap = codes.map((code, i) => ({
    code,
    field: fields[i],
    tag: tags[i],
    template: templates[i]
  }));
  // .filter((obj) => obj.template == "basic");
  // console.log(templateMap);
  return templateMap;
};

const openfundsCsvRows = (model) => {
  return model.shareClasses.map((shareClass) => ({
    ...model,
    ...model.company,
    ...model.fundManagers[0],
    ...shareClass
  }));
};

const openfundsApplyCsvTemplate = async (models, template) => {
  const fields = await openfundsGetTemplate(template);
  return [
    fields.map((f) => f.code),
    fields.map((f) => f.field),
    // fields.map((f) => openfundsKeyFromField(f)), // row with keys, just to debug
    ...models.flatMap((m) =>
      openfundsCsvRows(m).map((row) =>
        fields.map((f) => row[openfundsKeyFromField(f)])
      )
    )
  ];
};

export const openfunds = async (funds, template, format, client, res) => {
  console.log(`openfunds funds=${funds} template=${template} format=${format}`);
  let models;
  try {
    // validate & fetch funds in parallel with Promise.all
    // if anything errors, return 404 + one of the funds that errored
    models = await Promise.all(
      funds.map(
        (fund) =>
          new Promise(async (resolve, reject) => {
            const rejectErr = `Not Found: ${fund}`;
            // validate key
            const key = validatePubkey(fund);
            if (!key) {
              reject(rejectErr);
            }
            // fetch fund
            try {
              resolve(await client.fetchFund(key));
            } catch (err) {
              reject(rejectErr);
            }
          })
      )
    );
  } catch (err) {
    return res.status(404).send(err); // `Not Found: ${fund}`
  }

  console.log(util.inspect(models, false, null));

  switch (format.toLowerCase()) {
    case "csv": {
      const csv = await openfundsApplyCsvTemplate(models, template);
      res.setHeader("content-type", "text/csv");
      return res.send(await writeToBuffer(csv));
      break;
    }
    case "xls":
    case "xlsx": {
      const csv = await openfundsApplyCsvTemplate(models, template);
      const workbook = new ExcelJS.Workbook();
      const worksheet = await workbook.csv.read(write(csv));
      res.setHeader(
        "content-type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      return res.send(await workbook.xlsx.writeBuffer());
      break;
    }
  }
  res.send(JSON.stringify(models));
};
