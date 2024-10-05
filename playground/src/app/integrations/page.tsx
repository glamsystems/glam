"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IntegrationsList } from "./components/integrations-list";
import { TreeNodeData } from "@/components/CustomTree";
import { DownloadIcon } from "@radix-ui/react-icons";
import { integrations } from "./data";
import ToolbarTree from "@/components/ToolbarTree";
import PageContentWrapper from "@/components/PageContentWrapper";
import { useGlam } from "@glam/anchor/react";

const treeDataStake: TreeNodeData = {
  id: "all",
  label: "All",
  description: "",
  children: [
    {
      id: "native",
      label: "Native",
      description: "",
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
      children: [
        {
          id: "marinade_staking_deposit",
          label: "Deposit",
          description: "",
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
      children: [
        {
          id: "splStakePool_deposit",
          label: "Deposit",
          description: "",
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
      children: [
        {
          id: "sanctumStakePool_deposit",
          label: "Deposit",
          description: "",
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
              description:
                "Deposit stake accounts into the Sanctum Stake Pool.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
          ],
        },
        {
          id: "sanctumStakePool_withdraw",
          label: "Withdraw",
          description: "",
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
              description:
                "Withdraw stake accounts from the Sanctum Stake Pool.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
          ],
        },
      ],
    },
  ],
};

const treeDataSwap: TreeNodeData = {
  id: "all",
  label: "All",
  description: "",
  children: [
    {
      id: "jupiter",
      label: "Jupiter",
      description: "",
      children: [
        {
          id: "jupiter_swap",
          label: "Swap fund assets",
          description: "Swap only among fund assets",
          icon: <DownloadIcon className="w-4 h-4" />,
        },
        {
          id: "jupiter_swap_any",
          label: "Swap any asset",
          description:
            "Swap into any asset (can further constrain in risk management)",
          icon: <DownloadIcon className="w-4 h-4" />,
        },
      ],
    },
  ],
};

const treeDataTrade: TreeNodeData = {
  id: "all",
  label: "All",
  description: "",
  children: [
    {
      id: "drift",
      label: "Drift",
      description: "",
      children: [
        {
          id: "drift_basic",
          label: "Basic operations",
          description: "",
          children: [
            {
              id: "drift_deposit",
              label: "Deposit",
              description: "Deposit from treasury into Drift",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
            {
              id: "drift_withdraw",
              label: "Withdraw",
              description: "Withdraw from Drift into treasury",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
            {
              id: "update_user_delegate",
              label: "Update user delegate",
              description: "",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
          ],
        },
        {
          id: "drift_orders",
          label: "Orders",
          description:
            "Finer-grain permissions if user delegate is not enabled",
          children: [
            {
              id: "drift_place_orders",
              label: "Place orders",
              description: "",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
            {
              id: "drift_cancel_orders",
              label: "Cancel orders",
              description: "",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
          ],
        },
        {
          id: "drift_users",
          label: "Sub-accounts",
          description: "",
          children: [
            {
              id: "initialize_user",
              label: "Create sub-account",
              description: "",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
            {
              id: "drift_delete_user",
              label: "Delete sub-account",
              description: "",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
          ],
        },
        {
          id: "drift_config",
          label: "Update config",
          description: "",
          children: [
            {
              id: "update_user_custom_margin_ratio",
              label: "Increase max leverage",
              description: "",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
            {
              id: "update_user_margin_trading_enabled",
              label: "Enable margin trading",
              description: "",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
          ],
        },
      ],
    },
  ],
};

export default function Integrations() {
  //@ts-ignore
  const { allFunds, activeFund } = useGlam();
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeIntegration, setActiveIntegration] = useState(0);
  const [treeData, setTreeData] = useState<TreeNodeData>(treeDataStake);
  const [fundConfig, setFundConfig] = useState<string[][]>([]);

  const fundId = activeFund?.addressStr;
  const fund: any = fundId
    ? (allFunds || []).find((f: any) => f.idStr === fundId)
    : undefined;

  const toggleExpandCollapse = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCheckedItemsChange = useCallback(
    (newCheckedItems: Record<string, boolean>) => {
      setCheckedItems(newCheckedItems);
    },
    []
  );

  //TODO: load on chain data and remove this whole useEffect
  useEffect(() => {
    let newFundConfig = [[""], [""], [""]];
    switch (fundId) {
      case "G8NKLJ2Y3TFrjXpfkpGJQZLXvbKKyvNDzc84C8P3DDU8": // gmSOL
      case "F22FvADosEScBzKMf5iMmNgyrJfhpy4CgFoPYhVw3SHs": // pSOL
        newFundConfig = [
          [
            "marinade_deposit_stake",
            "marinade_delayed_unstake",
            "marinade_claim_tickets",
            "spl_stake_pool_deposit_stake",
            "spl_stake_pool_withdraw_sol",
            "spl_stake_pool_withdraw_stake",
            "sanctum_stake_pool_deposit_stake",
            "sanctum_stake_pool_withdraw_sol",
            "sanctum_stake_pool_withdraw_stake",
          ],
          ["jupiter_swap_any"],
          [""],
        ];
        integrations[0].active = true;
        integrations[1].active = true;
        integrations[2].active = false;
        break;
      case "9F7KB5xiFo8bt66Wey5AvNtmLxJYv4oq4tkhgpbgAG9f": // gnUSD
      case "GXDoZfmdDgB846vYmexuyCEs3C2ByNe7nGcgz4GZa1ZE": // pUSDC
        newFundConfig = [
          [""],
          ["jupiter_swap"],
          [
            "drift_deposit",
            "drift_withdraw",
            "drift_place_orders",
            "drift_cancel_orders",
          ],
        ];
        integrations[0].active = false;
        integrations[1].active = true;
        integrations[2].active = true;
        break;
    }

    let treeData;
    switch (activeIntegration) {
      case 1:
        treeData = treeDataSwap;
        break;
      case 2:
        treeData = treeDataTrade;
        break;
      default:
        treeData = treeDataStake;
    }
    const active = newFundConfig[activeIntegration] || [];

    const setChecked = (el: TreeNodeData) => {
      if (el.children) {
        (el.children || []).forEach(setChecked);
      } else {
        el.checked = active.indexOf(el.id) >= 0;
      }
    };

    console.log("updating checked...");
    (treeData.children || []).forEach(setChecked);
    setTreeData(treeData);
    setFundConfig(newFundConfig);
  }, [activeIntegration, fundId]);

  return (
    <PageContentWrapper>
      <div className="flex">
        <div className="w-[25%] max-w-[25%] min-w-[25%]">
          <Tabs defaultValue="all">
            <div>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="all">
              <IntegrationsList
                items={integrations}
                activeIntegration={activeIntegration}
                setActiveIntegration={setActiveIntegration}
              />
            </TabsContent>
            <TabsContent value="active">
              <IntegrationsList
                items={integrations.filter((item) => item.active)}
                activeIntegration={activeIntegration}
                setActiveIntegration={setActiveIntegration}
              />
            </TabsContent>
          </Tabs>
        </div>
        <div className="w-full ml-16">
          <ToolbarTree
            treeData={treeData}
            setTreeData={setTreeData}
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
