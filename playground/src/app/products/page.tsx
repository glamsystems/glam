"use client";

import DynamicForm from '@/components/DynamicForm';
import schema from './data/productFormSchema.json';
import {ResizablePanel, ResizablePanelGroup} from "@/components/ui/resizable";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Input} from "@/components/ui/input";
import {ProductsList} from "./components/products-list"
import {products} from "./data";

export default function Products() {
  return <div className="w-full flex">
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full items-stretch" // TODO: fix max height but allow to scroll
    >
      <ResizablePanel className="w-[25%] max-w-[25%] min-w-[25%]">
        <Tabs defaultValue="all">
          <div className="flex items-center px-4 py-2">
            <TabsList>
              <TabsTrigger
                value="all"
              >
                All products
              </TabsTrigger>
              <TabsTrigger
                value="active"
              >
                Managed
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <form>
              <div className="relative">
                {/*<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />*/}
                <Input placeholder="Search" className="pl-8" />
              </div>
            </form>
          </div>
          <TabsContent value="all" className="m-0">
            <ProductsList items={products} />
          </TabsContent>
          <TabsContent value="active" className="m-0">
            <ProductsList items={products.filter((item) => item.active)} />
          </TabsContent>
        </Tabs>
      </ResizablePanel>
      <ResizablePanel>
        <div className="p-16 mt-11">
            <DynamicForm schema={schema} />
        {/*<MailDisplay*/}
        {/*  mail={mails.find((item) => item.id === mail.selected) || null}*/}
        {/*/>*/}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>;
}
