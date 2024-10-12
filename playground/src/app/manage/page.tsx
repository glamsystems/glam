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
          <DynamicForm schema={schema} isNested={true} groups={["company", "fund", "fundManager"]} columns={2} />
      </div>
    </PageContentWrapper>);
}
