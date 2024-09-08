"use client";

import {Tabs, TabsContent, TabsList, TabsTrigger} from "../../components/ui/tabs";
import {IntegrationsList} from "./components/integrations-list";
import {integrations} from "./data";
import PageContentWrapper from "@/components/PageContentWrapper";

export default function Risk() {
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
              <IntegrationsList items={integrations.filter((item) => item.active)} />
            </TabsContent>
          </Tabs>
        </div>
        <div className="w-full ml-16">
        </div>
      </div>
    </PageContentWrapper>
  );
}
