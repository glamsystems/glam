import { TreeNodeData } from "@/components/CustomTree";

export const vaultTreeDataPermissions: TreeNodeData = {
  id: "all",
  label: "All",
  description: "",
  collapsed: false,
  children: [
    {
      id: "wsol",
      label: "wSOL",
      description: "",
      collapsed: false,
      children: [
        {
          id: "wSolWrap",
          label: "Wrap into wSOL",
          description: "",
        },
        {
          id: "wSolUnwrap",
          label: "Unwrap wSOL",
          description: "",
        },
      ],
    },
    {
      id: "jup",
      label: "Jupiter",
      description: "",
      collapsed: false,
      children: [
        {
          id: "jupiterSwapFundAssets",
          label: "Swap (only predefined assets)",
          description: "",
        },
        {
          id: "jupiterSwapAnyAsset",
          label: "Swap (any asset)",
          description: "",
        },
        {
          id: "jupiterSwapLst",
          label: "Swap (only LSTs)",
          description: "",
        },
        {
          id: "stakeJup",
          label: "Stake JUP tokens for governance/voting",
          description: "",
        },
        {
          id: "unstakeJup",
          label: "Unstake JUP tolens",
          description: "",
        },
        {
          id: "voteOnProposal",
          label: "Vote on proposals",
          description: "",
        },
      ],
    },
    {
      id: "lst",
      label: "Liquid Staking",
      description: "",
      collapsed: false,
      children: [
        {
          id: "stake",
          label: "Stake",
          description: "",
        },
        {
          id: "unstake",
          label: "Unstake and withdraw",
          description: "",
        },
        {
          id: "liquidUnstake",
          label: "Marinade liquid unstake (not recommended)",
          description: "",
        },
      ],
    },
    {
      id: "drift",
      label: "Drift",
      description: "",
      collapsed: true,
      children: [
        //TODO: these shouldn't be permissions - only manager?
        // {
        //   id: "driftInitialize",
        //   label: "Initialize Drift integration",
        //   description: "",
        // },
        // {
        //   id: "driftUpdateUser",
        //   label: "Update Drift sub-account",
        //   description: "",
        // },
        // {
        //   id: "driftDeleteUser",
        //   label: "Delete Drift sub-account",
        //   description: "",
        // },
        {
          id: "driftDeposit",
          label: "Deposit assets to Drift",
          description: "",
        },
        {
          id: "driftWithdraw",
          label: "Withdraw assets from Drift",
          description: "",
        },
        {
          id: "driftPlaceOrders",
          label: "Place orders (requires also Perp and/or Spot)",
          description: "",
        },
        {
          id: "driftPerpMarket",
          label: "Place orders on Perp Markets",
          description: "",
        },
        {
          id: "driftSpotMarket",
          label: "Place orders on Spot Markets",
          description: "",
        },
        {
          id: "driftCancelOrders",
          label: "Cancel orders",
          description: "",
        },
      ],
    },
  ],
};

export const mintTreeDataPermissions: TreeNodeData = {
  id: "all",
  label: "All",
  description: "",
  collapsed: false,
  children: [
    {
      id: "mint",
      label: "Mint permissions",
      description: "",
      children: [
        {
          id: "mintShare",
          label: "Mint new shares",
          description: "",
          collapsed: true,
        },
        {
          id: "burnShare",
          label: "Burn shares",
          description: "",
          collapsed: true,
        },
        {
          id: "setTokenAccountsStates",
          label: "Freeze/unfreeze token accounts",
          description: "",
          collapsed: true,
        },
      ],
    },
    {
      id: "mint",
      label: "Permanent Delegate",
      description: "",
      children: [
        {
          id: "forceTransferShare",
          label: "Transfer or burn shares from any account",
          description: "",
          collapsed: true,
        },
      ],
    },
  ],
};
