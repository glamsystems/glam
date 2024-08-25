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
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import ToolbarTree from "@/components/ToolbarTree";
import * as React from "react";

export default function Products() {
  return (
    <PageContentWrapper>
      <div className="flex">
        <div className="w-[25%] max-w-[25%] min-w-[25%]">
          <Tabs defaultValue="all">
            <div>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TooltipProvider>
                  <Tooltip>
                    <Sheet>
                      <SheetTrigger asChild>
                        <TooltipTrigger>
                          <Button
                            variant="ghost"
                            className="ml-4 h-10"
                            size="icon"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                      </SheetTrigger>
                      <SheetContent
                        side="right"
                        className="p-12 sm:max-w-none w-1/2"
                      >
                        <SheetHeader>
                          <SheetTitle>Create Share Class</SheetTitle>
                          <SheetDescription>
                            Create a new share class.
                          </SheetDescription>
                        </SheetHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="fullShareClassName" className="text-right">
                              Full Share Class Name
                            </Label>
                            <Input id="fullShareClassName" placeholder="ESPA Bond Danubia A EUR" className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="shareClassSymbol" className="text-right">
                              Share Class Symbol
                            </Label>
                            <Input
                              id="shareClassSymbol"
                              placeholder="EBDAE"
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="shareClassCurrency" className="text-right">
                              Share Class Currency
                            </Label>
                            <Input
                              id="username"
                              placeholder="SOL"
                              className="col-span-3"
                            />
                          </div>
                        </div>
                        <SheetFooter>
                          <SheetClose asChild>
                            <Button type="submit">Create Share Class</Button>
                          </SheetClose>
                        </SheetFooter>
                      </SheetContent>
                    </Sheet>
                    <TooltipContent side="right">
                      <p>Create Share Class</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
            groups={["shareClass"]}
          />
        </div>
      </div>
    </PageContentWrapper>
  );
}
