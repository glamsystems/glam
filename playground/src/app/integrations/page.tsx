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
import { DownloadIcon } from "@radix-ui/react-icons";

const treeData: TreeNodeData = {
  id: "all",
  label: "All",
  collapsed: false,
  children: [
    {
      id: "native",
      label: "Native",
      collapsed: false,
      children: [
        { id: "initialize_and_delegate_stake", label: "Initialize and delegate stake", icon: <DownloadIcon className="w-4 h-4" /> },
        { id: "deactivate_stake_accounts", label: "Deactivate stake accounts", icon: <DownloadIcon className="w-4 h-4" /> },
        { id: "withdraw_from_stake_accounts", label: "Withdraw from stake accounts", icon: <DownloadIcon className="w-4 h-4" /> },
      ],
    },
    {
      id: "marinade_staking",
      label: "Marinade Staking",
      collapsed: false,
      children: [
        {
          id: "deposit",
          label: "Deposit",
          collapsed: true,
          children: [
            { id: "marinade_deposit_sol", label: "Deposit", icon: <DownloadIcon className="w-4 h-4" /> },
            { id: "marinade_deposit_stake", label: "Deposit stake", icon: <DownloadIcon className="w-4 h-4" /> },
          ]
        },
        {
          id: "withdraw",
          label: "Withdraw",
          collapsed: true,
          children: [
            { id: "marinade_delayed_unstake", label: "Delayed unstake", icon: <DownloadIcon className="w-4 h-4" /> },
            { id: "marinade_claim_tickets", label: "Claim tickets", icon: <DownloadIcon className="w-4 h-4" /> }
          ]
        },
      ],
    },
    {
      id: "splStakePool",
      label: "SPL Stake Pool",
      collapsed: false,
      children: [
        { id: "spl_stake_pool_deposit_sol", label: "Deposit", icon: <DownloadIcon className="w-4 h-4" /> },
        { id: "spl_stake_pool_deposit_stake", label: "Deposit stake", icon: <DownloadIcon className="w-4 h-4" /> },
        { id: "spl_stake_pool_withdraw_sol", label: "Withdraw", icon: <DownloadIcon className="w-4 h-4" /> },
        { id: "spl_stake_pool_withdraw_stake", label: "Withdraw stake", icon: <DownloadIcon className="w-4 h-4" /> }
      ],
    },
    {
      id: "sanctumStakePool",
      label: "Sanctum Stake Pool",
      collapsed: false,
      children: [
        { id: "sanctum_stake_pool_deposit_sol", label: "Deposit", icon: <DownloadIcon className="w-4 h-4" /> },
        { id: "sanctum_stake_pool_deposit_stake", label: "Deposit stake", icon: <DownloadIcon className="w-4 h-4" /> },
        { id: "sanctum_stake_pool_withdraw_sol", label: "Withdraw", icon: <DownloadIcon className="w-4 h-4" /> },
        { id: "sanctum_stake_pool_withdraw_stake", label: "Withdraw stake", icon: <DownloadIcon className="w-4 h-4" /> }
      ],
    },
  ],
};

export default function TreePage() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Use useCallback to memoize the handleCheckedItemsChange function
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
        className="h-full max-h-[800px] items-stretch"
      >
        <ResizablePanel className="w-[25%] max-w-[25%] min-w-[25%]">
          <Tabs defaultValue="all">
            <div className="flex items-center px-4 py-2">
              <TabsList>
                <TabsTrigger value="all">All integrations</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
              </TabsList>
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
        <ResizableHandle />
        <ResizablePanel>
          <div className="space-y-4 overflow-auto">
            <CustomTree data={treeData} onCheckedItemsChange={handleCheckedItemsChange} />
          </div>
          <div className="mt-4 p-4">
            <h3 className="text-lg font-semibold mb-2">Checked Items:</h3>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(checkedItems, null, 2)}
            </pre>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
