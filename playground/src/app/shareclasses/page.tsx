"use client";

import DynamicForm from '@/components/DynamicForm';
import schema from '../../data/glamFormSchema.json';
import {ResizablePanel, ResizablePanelGroup} from "@/components/ui/resizable";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Input} from "@/components/ui/input";
import {ShareClassesList} from "./components/shareClasses-list"
import {shareClasses} from "./data";
import {Button} from "@/components/ui/button";
import {FilePlusIcon, PlusIcon} from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
                All share classes
              </TabsTrigger>
              <TabsTrigger
                value="active"
              >
                Active
              </TabsTrigger>
            </TabsList>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button variant="ghost" className="ml-4" size="icon">
                    <PlusIcon className="h-4 w-4"/>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Add share class</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <form>
              <div className="relative">
                {/*<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search" className="pl-8" />*/}
              </div>
            </form>
          </div>
          <TabsContent value="all" className="m-0">
            <ShareClassesList items={shareClasses} />
          </TabsContent>
          <TabsContent value="active" className="m-0">
            <ShareClassesList items={shareClasses.filter((item) => item.active)} />
          </TabsContent>
        </Tabs>
      </ResizablePanel>
      <ResizablePanel>
        <div className="p-16 mt-9">
          <DynamicForm schema={schema} isNested={true} groups={["shareClass"]}/>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>;
}
