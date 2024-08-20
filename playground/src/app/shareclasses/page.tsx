"use client";

import DynamicForm from '@/components/DynamicForm';
import schema from '../../data/glamFormSchema.json';
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {ShareClassesList} from "./components/shareClasses-list"
import {shareClasses} from "./data";
import {Button} from "@/components/ui/button";
import {PlusIcon} from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PageContentWrapper from "@/components/PageContentWrapper";

export default function Products() {
  return (
    <PageContentWrapper>
    <div className="flex">
      <div className="w-[25%] max-w-[25%] min-w-[25%]">
        <Tabs defaultValue="all">
          <div>
            <TabsList>
              <TabsTrigger value="all">All share classes</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Button variant="ghost" className="ml-4 h-10" size="icon">
                      <PlusIcon className="h-4 w-4"/>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Add share class</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TabsList>
          </div>
          <TabsContent value="all">
            <ShareClassesList items={shareClasses} />
          </TabsContent>
          <TabsContent value="active">
            <ShareClassesList items={shareClasses.filter((item) => item.active)} />
          </TabsContent>
        </Tabs>
      </div>
      <div className="w-full ml-16">
        <DynamicForm schema={schema} isNested={true} groups={["shareClass"]}/>
      </div>
    </div>
    </PageContentWrapper>
  );
}
