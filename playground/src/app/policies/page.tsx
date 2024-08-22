"use client";

import {Tabs, TabsContent, TabsList, TabsTrigger} from "../../components/ui/tabs";
import {PoliciesList} from "./components/policies-list";
import {policies} from "./data";
import PageContentWrapper from "@/components/PageContentWrapper";

export default function Policies() {
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
              <PoliciesList items={policies} />
            </TabsContent>
            <TabsContent value="active">
              <PoliciesList items={policies.filter((item) => item.active)} />
            </TabsContent>
          </Tabs>
        </div>
        <div className="w-full ml-16">
        </div>
      </div>
    </PageContentWrapper>
  );
}
