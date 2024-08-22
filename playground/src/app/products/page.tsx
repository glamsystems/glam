"use client";

import DynamicForm from '@/components/DynamicForm';
import schema from '../../data/glamFormSchema.json'
import {ResizablePanel, ResizablePanelGroup} from "@/components/ui/resizable";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Input} from "@/components/ui/input";
import {ProductsList} from "./components/products-list"
import {products} from "./data";
import PageContentWrapper from "@/components/PageContentWrapper";

export default function Products() {
  return (
    <PageContentWrapper>
    <div className="flex">
      <div className="w-[25%] max-w-[25%] min-w-[25%]">
        <Tabs defaultValue="all">
          <div>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Managed</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="all">
            <ProductsList items={products} />
          </TabsContent>
          <TabsContent value="active">
            <ProductsList items={products.filter((item) => item.active)} />
          </TabsContent>
        </Tabs>
      </div>
        <div className="w-full ml-16 pt-[26px]">
            <DynamicForm schema={schema} isNested={true} groups={["company", "fund", "fundManager"]} />
        </div>
      </div>
  </PageContentWrapper>
  );
}
