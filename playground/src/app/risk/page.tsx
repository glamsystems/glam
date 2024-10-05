"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { IntegrationsList } from "./components/integrations-list";
import { integrations } from "./data";
import PageContentWrapper from "@/components/PageContentWrapper";
import { useGlam } from "@glam/anchor/react";

export default function Risk() {
  //@ts-ignore
  const { allFunds, activeFund } = useGlam();

  const fundId = activeFund?.addressStr;
  const fund: any = fundId
    ? (allFunds || []).find((f: any) => f.idStr === fundId)
    : undefined;

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
        <div className="w-full ml-16"></div>
      </div>
    </PageContentWrapper>
  );
}
