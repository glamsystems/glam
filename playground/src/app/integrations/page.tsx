"use client";

import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from "../../components/ui/resizable";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "../../components/ui/tabs";
import {Separator} from "../../components/ui/separator";
import {Input} from "../../components/ui/input";
import {IntegrationsList} from "./components/integrations-list";
import {integrations} from "./data";

export default function Integrations() {
  return <div className="w-full flex">
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full max-h-[800px] items-stretch"
    >
      <ResizablePanel className="w-[25%] max-w-[25%] min-w-[25%]">
        <Tabs defaultValue="all">
          <div className="flex items-center px-4 py-2">
            <TabsList>
              <TabsTrigger
                value="all"
              >
                All integrations
              </TabsTrigger>
              <TabsTrigger
                value="active"
              >
                Active
              </TabsTrigger>
            </TabsList>
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
            <IntegrationsList items={integrations} />
          </TabsContent>
          <TabsContent value="active" className="m-0">
            <IntegrationsList items={integrations.filter((item) => item.active)} />
          </TabsContent>
        </Tabs>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>
        {/*<MailDisplay*/}
        {/*  mail={mails.find((item) => item.id === mail.selected) || null}*/}
        {/*/>*/}
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>;
}
