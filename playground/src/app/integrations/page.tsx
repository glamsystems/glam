"use client";

import React, { useState, useCallback } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IntegrationsList } from "./components/integrations-list";
import { integrations } from "./data";
import CustomTree from "@/components/CustomTree";
import { TreeNodeData } from "@/components/CustomTree";
import { DoubleArrowDownIcon, DoubleArrowRightIcon, DoubleArrowUpIcon, DownloadIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const treeData: TreeNodeData = {
  id: "all",
  label: "All",
  description: "",
  collapsed: false,
  children: [
    {
      id: "native",
      label: "Native",
      description: "",
      collapsed: true,
      children: [
        {
          id: "initialize_and_delegate_stake",
          label: "Initialize and delegate stake",
          description: "",
          icon: <DownloadIcon className="w-4 h-4" />,
        },
        {
          id: "deactivate_stake_accounts",
          label: "Deactivate stake accounts",
          description: "",
          icon: <DownloadIcon className="w-4 h-4" />,
        },
        {
          id: "withdraw_from_stake_accounts",
          label: "Withdraw from stake accounts",
          description: "",
          icon: <DownloadIcon className="w-4 h-4" />,
        },
      ],
    },
    {
      id: "marinade_staking",
      label: "Marinade Staking",
      description: "",
      collapsed: false,
      children: [
        {
          id: "marinade_staking_deposit",
          label: "Deposit",
          description: "",
          collapsed: true,
          children: [
            {
              id: "marinade_deposit_sol",
              label: "Deposit SOL",
              description: "Deposit SOL directly into Marinade.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
            {
              id: "marinade_deposit_stake",
              label: "Deposit stake",
              description: "Deposit existing stake accounts into Marinade.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
          ],
        },
        {
          id: "marinade_staking_withdraw",
          label: "Withdraw",
          description: "",
          collapsed: true,
          children: [
            {
              id: "marinade_delayed_unstake",
              label: "Delayed unstake",
              description: "Unstake SOL with a delay.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
            {
              id: "marinade_claim_tickets",
              label: "Claim tickets",
              description: "Claim tickets after delayed unstaking.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
          ],
        },
      ],
    },
    {
      id: "splStakePool",
      label: "SPL Stake Pool",
      description: "",
      collapsed: false,
      children: [
        {
          id: "splStakePool_deposit",
          label: "Deposit",
          description: "",
          collapsed: true,
          children: [
            {
              id: "spl_stake_pool_deposit_sol",
              label: "Deposit SOL",
              description: "Deposit SOL into the SPL Stake Pool.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
            {
              id: "spl_stake_pool_deposit_stake",
              label: "Deposit stake",
              description: "Deposit stake accounts into the SPL Stake Pool.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
          ],
        },
        {
          id: "splStakePool_withdraw",
          label: "Withdraw",
          description: "",
          collapsed: true,
          children: [
            {
              id: "spl_stake_pool_withdraw_sol",
              label: "Withdraw SOL",
              description: "Withdraw SOL from the SPL Stake Pool.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
            {
              id: "spl_stake_pool_withdraw_stake",
              label: "Withdraw stake",
              description: "Withdraw stake accounts from the SPL Stake Pool.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
          ],
        },
      ],
    },
    {
      id: "sanctumStakePool",
      label: "Sanctum Stake Pool",
      description: "",
      collapsed: false,
      children: [
        {
          id: "sanctumStakePool_deposit",
          label: "Deposit",
          description: "",
          collapsed: true,
          children: [
            {
              id: "sanctum_stake_pool_deposit_sol",
              label: "Deposit SOL",
              description: "Deposit SOL into the Sanctum Stake Pool.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
            {
              id: "sanctum_stake_pool_deposit_stake",
              label: "Deposit stake",
              description: "Deposit stake accounts into the Sanctum Stake Pool.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
          ],
        },
        {
          id: "sanctumStakePool_withdraw",
          label: "Withdraw",
          description: "",
          collapsed: true,
          children: [
            {
              id: "sanctum_stake_pool_withdraw_sol",
              label: "Withdraw SOL",
              description: "Withdraw SOL from the Sanctum Stake Pool.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
            {
              id: "sanctum_stake_pool_withdraw_stake",
              label: "Withdraw stake",
              description: "Withdraw stake accounts from the Sanctum Stake Pool.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
          ],
        },
      ],
    },
  ],
};

export default function Integrations() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpandCollapse = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCheckedItemsChange = useCallback(
    (newCheckedItems: Record<string, boolean>) => {
      setCheckedItems(newCheckedItems);
    },
    []
  );

  return (
    <div className="w-full flex">
      <ResizablePanelGroup
        direction="horizontal"
        className="h-full items-stretch"
      >
        <ResizablePanel className="w-[25%] max-w-[25%] min-w-[25%]">
          <Tabs defaultValue="all">
            <div className="flex items-center px-4 py-2">
              <TabsList>
                <TabsTrigger value="all">All integrations</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
              </TabsList>
            </div>

            <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              {/*<form>*/}
              {/*  <div className="relative">*/}
              {/*    <MagnifyingGlassIcon className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />*/}
              {/*    <Input placeholder="Search" className="pl-8" />*/}
              {/*  </div>*/}
              {/*</form>*/}
            </div>

            <TabsContent value="all" className="m-0">
              <IntegrationsList items={integrations} />
            </TabsContent>
            <TabsContent value="active" className="m-0">
              <IntegrationsList
                items={integrations.filter((item) => item.active)}
              />
            </TabsContent>
          </Tabs>
        </ResizablePanel>
        <ResizablePanel>
          <div className="pl-12 pr-12 pt-2">
            <form className="w-full">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search" className="pl-8" />
              </div>
            </form>
          </div>
          <div className="flex  flex-col pl-12 pr-12 pt-10">
            <div className="flex">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      className="mr-4"
                      variant="outline"
                      size="icon"
                      onClick={toggleExpandCollapse}
                    >
                      {isExpanded ? (<DoubleArrowDownIcon className="w-4 h-4" />) : (<DoubleArrowRightIcon className="w-4 h-4" />)}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{isExpanded ? "Collapse all" : "Expand all"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CustomTree
              data={treeData}
              onCheckedItemsChange={handleCheckedItemsChange}
              isExpanded={isExpanded} // Pass isExpanded state to CustomTree
            />
          </div>
          {/*<div className="mt-4 p-4">*/}
          {/*  <h3 className="text-lg font-semibold mb-2">Checked Items:</h3>*/}
          {/*  <pre className="whitespace-pre-wrap">*/}
          {/*    {JSON.stringify(checkedItems, null, 2)}*/}
          {/*  </pre>*/}
          {/*</div>*/}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>);
}

// https://dev.to/alais29dev/building-a-real-time-search-filter-in-react-a-step-by-step-guide-3lmm
