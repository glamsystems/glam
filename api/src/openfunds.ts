/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import * as ExcelJS from "exceljs";
import * as util from "util";
import * as lodash from "lodash";
import { ShareClassModel } from "@glam/anchor";
import { write, writeToBuffer } from "@fast-csv/format";
import { parseString } from "@fast-csv/parse";

import { validatePubkey } from "./validation";

const openfundsGetTemplate = async (template) => {
  const templateUrl =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRieRstFVBGCkV0rVYwNmypV5nMdFtJcqP7TtzIgAC8JA9lXHePI4oXO04aaC7EcLc0f6bt9MW6tJw7/pub?output=csv";
  const res = await fetch(templateUrl);

  const templateCsv: Array<Array<string>> = await new Promise(
    async (resolve, reject) => {
      let templateCsv = [];
      parseString(await res.text())
        .on("data", (row) => {
          templateCsv.push(row);
        })
        .on("end", (rowCount: number) => {
          resolve(templateCsv);
        });
    }
  );

  let allowedTags = [];
  let glamFields = true;
  let filterTemplate = "complete";
  switch (template) {
    case "basic":
    case "glam-basic":
      filterTemplate = "basic";
      break;
    case "of-basic":
      filterTemplate = "basic";
      glamFields = false;
      break;
    case "of-complete":
      glamFields = false;
      break;
    case "of-essential":
      allowedTags = ["essential"];
      // glamFields = false;
      break;
    case "of-core":
      allowedTags = ["essential", "core"];
      // glamFields = false;
      break;
    case "of-additional":
      allowedTags = ["essential", "core", "additional"];
      // glamFields = false;
      break;
  }

  const cleanField = (field) => {
    let val = "";
    try {
      val = field
        .split(" ")
        .map((word) =>
          [word[0].toUpperCase(), ...word.split("").splice(1)].join("")
        )
        .join(" ");
    } catch (e) {
      console.log("field", field);
    }
    return val;
  };

  const templateMap = templateCsv
    .slice(1)
    .map((row, i) => ({
      code: row[0],
      field: cleanField(row[1]),
      key: lodash.camelCase(row[1]),
      tag: row[2],
      template: row[4],
      version: Number(row[5])
    }))
    .filter((obj) => obj.version === 1)
    .filter((obj) =>
      filterTemplate === "complete" ? true : obj.template === filterTemplate
    )
    .filter((obj) =>
      allowedTags.length === 0 ? true : allowedTags.indexOf(obj.tag) >= 0
    )
    .filter((obj) => (glamFields ? true : obj.tag !== "glam"));
  // console.log(templateMap);
  return templateMap;
};

const openfundsCsvRows = (model) => {
  return (
    model.shareClasses.length > 0
      ? model.shareClasses
      : [new ShareClassModel({})]
  ).map((shareClass) => ({
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
    // fields.map((f) => f.key), // row with keys, just to debug
    ...models.flatMap((m) =>
      openfundsCsvRows(m).map((row) => fields.map((f) => row[f.key]))
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
              return reject(rejectErr);
            }
            // fetch fund
            try {
              return resolve(await client.fetchFund(key));
            } catch (err) {
              console.error(err);
              return reject(rejectErr);
            }
          })
      )
    );
  } catch (err) {
    return res.status(404).send(err); // `Not Found: ${fund}`
  }

  console.log(util.inspect(models, false, null));
  let actualTemplate = template;
  if (template === "auto") {
    actualTemplate = models.every((m) => m.shareClasses.length <= 1)
      ? "basic"
      : "complete";
  }

  switch (format.toLowerCase()) {
    case "csv": {
      const csv = await openfundsApplyCsvTemplate(models, actualTemplate);
      res.setHeader("content-type", "text/csv");
      return res.send(await writeToBuffer(csv));
      break;
    }
    case "xls":
    case "xlsx": {
      const csv = await openfundsApplyCsvTemplate(models, actualTemplate);
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
