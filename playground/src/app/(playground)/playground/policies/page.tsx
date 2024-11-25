"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../components/ui/tabs";
import { ShareClassesList } from "@/app/(playground)/playground/shareclasses/components/shareClasses-list";
import { shareClasses } from "@/app/(playground)/playground/shareclasses/data";
import PageContentWrapper from "@/components/PageContentWrapper";
import DynamicForm from "@/components/DynamicForm";
import schema from "../../../../data/glamFormSchema.json";

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
              <ShareClassesList items={shareClasses} />
            </TabsContent>
            <TabsContent value="active">
              <ShareClassesList
                items={shareClasses.filter((item) => item.active)}
              />
            </TabsContent>
          </Tabs>
        </div>
        <div className="w-full ml-16 pt-[26px]">
          <DynamicForm
            schema={schema}
            isNested={true}
            groups={["shareClassPolicy"]}
          />
        </div>
      </div>
    </PageContentWrapper>
  );
}
