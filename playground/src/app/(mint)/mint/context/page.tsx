"use client";

import React, { useEffect, useState } from "react";
import PageContentWrapper from "@/components/PageContentWrapper";
import DynamicForm from "@/components/DynamicForm";
import schema from "@/data/glamFormSchema.json";
import { useGlam } from "@glam/anchor/react";
import { Button } from "@/components/ui/button";

// TODO: Refactoring needed to avoid dupe code
interface SchemaField {
  type: string;
  title?: string;
  description?: string;
  fields?: Record<string, SchemaField>;
  "x-id"?: string;
  "x-tag"?: string;
  "x-component"?: string;
  "x-order"?: number;
  "x-hidden"?: boolean;
  "x-enforced"?: boolean;
  minLength?: number;
  maxLength?: number;
  [key: string]: any;
}

interface SchemaGroup {
  type: string;
  fields: Record<string, SchemaField>;
}

export default function MintContextPage() {
  // @ts-ignore
  const { fund: fundPDA, allFunds } = useGlam();

  const [openfundsData, setOpenfundsData] = useState<Record<string, any>>({
    company: {},
    fund: {},
    fundManager: {},
    shareClass: {},
  });

  useEffect(() => {
    if (fundPDA && allFunds) {
      const fund = allFunds.find((f) => f.id && f.id.equals(fundPDA));
      if (fund) {
        setOpenfundsData({
          ...openfundsData,
          company: {
            fundGroupName: fund.company.fundGroupName,
          },
          fund: {
            legalFundNameIncludingUmbrella: fund.name,
            fundDomicileAlpha2: fund.rawOpenfunds?.fundDomicileAlpha2,
          },
          shareClass: {
            iSIN: fund.shareClasses[0].rawOpenfunds?.isin,
            shareClassCurrency:
              fund.shareClasses[0].rawOpenfunds?.shareClassCurrency,
          },
        });

        console.log("openfundsData", openfundsData);
      }
    }
  }, [fundPDA, allFunds]);

  const handleOpenfundsChange = (data: Record<string, any>) => {
    // Create a new object to store grouped data
    const groupedData: Record<string, any> = {
      company: {},
      fund: {},
      fundManager: {},
      shareClass: {},
    };

    // Type guard to check if a group has fields
    const isSchemaGroup = (value: any): value is SchemaGroup => {
      return value && typeof value === "object" && "fields" in value;
    };

    // Iterate through the schema groups to properly organize the data
    Object.keys(groupedData).forEach((group) => {
      const schemaGroup = schema[group as keyof typeof schema];
      if (isSchemaGroup(schemaGroup)) {
        Object.keys(schemaGroup.fields).forEach((fieldKey) => {
          if (data[fieldKey] !== undefined) {
            groupedData[group][fieldKey] = data[fieldKey];
          }
        });
      }
    });
    setOpenfundsData(groupedData);
  };

  return (
    <PageContentWrapper>
      <div className="flex flex-col space-y-4">
        <OpenfundsForm
          openfundsData={openfundsData}
          onChange={handleOpenfundsChange}
        />
        <div className="flex space-x-4 w-full">
          <Button className="w-1/2" variant="ghost" onClick={(event) => {}}>
            Reset
          </Button>
          <Button className="w-1/2" type="submit" loading={false}>
            Update
          </Button>
        </div>
      </div>
    </PageContentWrapper>
  );
}

function OpenfundsForm({
  openfundsData,
  onChange,
}: {
  openfundsData: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}) {
  // Flatten the openfundsData for the DynamicForm
  const flattenedData = Object.entries(openfundsData).reduce(
    (acc, [group, fields]) => {
      return { ...acc, ...fields };
    },
    {},
  );

  return (
    <div>
      <h2 className="text-xl mb-6 text-muted-foreground font-extralight">
        Openfunds Details
      </h2>
      <DynamicForm
        schema={schema}
        isNested={true}
        groups={["company", "fund", "fundManager", "shareClass"]}
        columns={2}
        showSubmitButton={false}
        onChange={onChange}
        defaultValues={flattenedData}
      />
    </div>
  );
}
