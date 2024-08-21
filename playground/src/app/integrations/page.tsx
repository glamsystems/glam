"use client";

import React, { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IntegrationsList } from "./components/integrations-list";
import { integrations } from "./data";
import { TreeNodeData } from "@/components/CustomTree";
import { DownloadIcon } from "@radix-ui/react-icons";
import ToolbarTree from "@/components/ToolbarTree";
import PageContentWrapper from "@/components/PageContentWrapper";

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
    <PageContentWrapper>
      <div className="flex">
        <div className="w-[25%] max-w-[25%] min-w-[25%]">
          <Tabs defaultValue="all">
            <div>
              <TabsList>
                <TabsTrigger value="all">All Integrations</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="all">
              <IntegrationsList items={integrations} />
            </TabsContent>
            <TabsContent value="active">
              <IntegrationsList
                items={integrations.filter((item) => item.active)}
              />
            </TabsContent>
          </Tabs>
        </div>
        <div className="w-full ml-16">
          <ToolbarTree
            treeData={treeData}
            isExpanded={isExpanded}
            toggleExpandCollapse={toggleExpandCollapse}
            handleCheckedItemsChange={handleCheckedItemsChange}
          />
        </div>
      </div>
    </PageContentWrapper>
  );
}

// https://dev.to/alais29dev/building-a-real-time-search-filter-in-react-a-step-by-step-guide-3lmm
