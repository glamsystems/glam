"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../components/ui/tabs";
import { IntegrationsList } from "./components/integrations-list";
import { integrations } from "./data";
import PageContentWrapper from "@/components/PageContentWrapper";
import { useGlam } from "@glam/anchor/react";
import DynamicForm from "@/components/DynamicForm";
import schema from "../../../../data/glamRiskSchema.json";
import { useForm } from "react-hook-form";

export default function Risk() {
  // @ts-ignore
  const {
    allGlamStates: allFunds,
    activeGlamState: activeFund,
    glamClient,
  } = useGlam();

  const fundId = activeFund?.address;
  const fund: any = fundId
    ? (allFunds || []).find((f: any) => f.idStr === fundId)
    : undefined;

  const driftForm = useForm<any>({
    defaultValues: {
      driftAccessControl: 0,
      driftDelegatedAccount: null,
      driftMarketIndexesPerp: [],
      driftOrderTypes: [],
      driftMaxLeverage: null,
      driftEnableSpot: false,
      driftMarketIndexesSpot: [],
    },
  });

  useEffect(() => {
    const fetchDriftData = async () => {
      const driftPolicy = await glamClient.drift.fetchPolicyConfig(fund);
      for (const [key, value] of Object.entries(driftPolicy)) {
        driftForm.setValue(key, value);
      }
    };

    fetchDriftData();
  }, [fund]);

  //TODO: load on chain data and remove this whole useEffect
  const [rerender, setRerender] = useState(0);
  useEffect(() => {
    switch (fundId) {
      case "G8NKLJ2Y3TFrjXpfkpGJQZLXvbKKyvNDzc84C8P3DDU8": // gmSOL
      case "F22FvADosEScBzKMf5iMmNgyrJfhpy4CgFoPYhVw3SHs": // pSOL
        integrations[0].active = false;
        integrations[1].active = true;
        integrations[2].active = true;
        integrations[3].active = true;
        integrations[4].active = true;
        integrations[5].active = false;
        break;
      case "9F7KB5xiFo8bt66Wey5AvNtmLxJYv4oq4tkhgpbgAG9f": // gnUSD
      case "GXDoZfmdDgB846vYmexuyCEs3C2ByNe7nGcgz4GZa1ZE": // pUSDC
        integrations[0].active = true;
        integrations[1].active = true;
        integrations[2].active = false;
        integrations[3].active = false;
        integrations[4].active = false;
        integrations[5].active = false;
        break;
    }
    setRerender(rerender + 1);
  }, [fundId]);

  // form behavior, change visible fields based on access control
  const watchDriftAccessControl = driftForm.watch("driftAccessControl");
  useEffect(() => {
    if (watchDriftAccessControl === 0) {
      schema.drift.fields.driftDelegatedAccount["x-hidden"] = false;
      schema.drift.fields.driftMarketIndexesPerp["x-hidden"] = true;
      schema.drift.fields.driftOrderTypes["x-hidden"] = true;
      schema.drift.fields.driftMarketIndexesSpot["x-hidden"] = true;
    } else {
      schema.drift.fields.driftDelegatedAccount["x-hidden"] = true;
      schema.drift.fields.driftMarketIndexesPerp["x-hidden"] = false;
      schema.drift.fields.driftOrderTypes["x-hidden"] = false;
      schema.drift.fields.driftMarketIndexesSpot["x-hidden"] = false;
    }
    setRerender(rerender + 1);
  }, [watchDriftAccessControl]);

  return (
    <PageContentWrapper>
      <div className="flex">
        <div className="w-[25%] max-w-[25%] min-w-[25%]">
          <Tabs defaultValue="all">
            <div className="flex items-center">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="all">
              <IntegrationsList items={integrations} />
            </TabsContent>
            <TabsContent value="active">
              <IntegrationsList
                items={integrations.filter((item) => item.active)}
              />
            </TabsContent>
          </Tabs>
        </div>
        <div className="w-full ml-16 pt-[26px]">
          <DynamicForm
            schema={schema}
            isNested={true}
            groups={["drift"]}
            formData={driftForm}
            onSubmit={(data: any) => {
              console.log("submit", data);
            }}
          />
        </div>
      </div>
    </PageContentWrapper>
  );
}
