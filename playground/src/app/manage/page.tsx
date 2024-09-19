"use client";

import DynamicForm from '@/components/DynamicForm';
import schema from '../../data/glamFormSchema.json'
import {ResizablePanel, ResizablePanelGroup} from "@/components/ui/resizable";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Input} from "@/components/ui/input";
import {ProductsList} from "./components/products-list"
import {products} from "./data";
import PageContentWrapper from "@/components/PageContentWrapper";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import Sparkle from "@/utils/Sparkle";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import React, { useState } from "react";
import { useGlam } from "@glam/anchor/react";

export default function Product() {
  const { glamClient, allFunds, walletBalances } = useGlam();
  const [fundId, setFundId] = useState("");
  const [open, setOpen] = React.useState(false);
  const fund: any = fundId
    ? (allFunds || []).find((f: any) => f.idStr === fundId)
    : undefined;

  return (
    <PageContentWrapper>
      <div className="w-4/6 self-center">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild className="mb-5">
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full pl-2 justify-between"
            >
              <span className="flex flex-row align-center">
              <span className="mr-2">
                {fundId ? (
                  <Sparkle
                    address={(allFunds.find((f: any) => f.idStr === fundId) as any)?.imageKey}
                    size={24}
                  />
                ) : (
                  <div className="h-[24px] w-[24px] border"></div>
                )}
              </span>
              <span className="leading-6">
                {fundId
                  ? allFunds.find((f: any) => f.idStr === fundId)?.name
                  : "Select product..."}
              </span>
              </span>
              <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search product..." />
              <CommandList>
                <CommandEmpty>No product found.</CommandEmpty>
                <CommandGroup>
                  {allFunds.map((f) => (
                    <CommandItem
                      key={(f as any)?.idStr}
                      onSelect={() => {
                        setFundId((f as any)?.idStr);
                        setOpen(false);
                      }}
                      className="flex items-center"
                    >
                      <span className="mr-2">
                        <Sparkle
                          address={(f as any)?.imageKey}
                          size={24}
                        />
                      </span>
                      {f.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

          <DynamicForm schema={schema} isNested={true} groups={["company", "fund", "fundManager"]} columns={2} />
      </div>
    </PageContentWrapper>);
}
