import {
  CheckCircledIcon,
  RadiobuttonIcon,
  StopwatchIcon,
} from "@radix-ui/react-icons";
import { ASSETS_MAINNET } from "anchor/src/client/assets";

export const stakePoolsStateAccounts = Array.from(ASSETS_MAINNET.entries())
  .filter(([mint, meta]) => meta.stateAccount)
  .map(([mint, meta]) => ({
    mint,
    stateAccount: meta.stateAccount,
  }));

export const types = [
  {
    value: "stake-account",
    label: "Stake Account",
  },
  {
    value: "ticket",
    label: "Ticket",
  },
];

export const statuses = [
  {
    value: "pending",
    label: "Pending",
    icon: StopwatchIcon,
    lightModeColor: "text-amber-500",
    darkModeColor: "text-amber-400",
  },
  {
    value: "claimable",
    label: "Claimable",
    icon: CheckCircledIcon,
    lightModeColor: "text-emerald-600",
    darkModeColor: "text-emerald-400",
  },
  {
    value: "active",
    label: "Active",
    icon: RadiobuttonIcon,
    lightModeColor: "text-foreground",
    darkModeColor: "text-foreground",
  },
  {
    value: "deactivating",
    label: "Deactivating",
    icon: StopwatchIcon,
    lightModeColor: "text-amber-500",
    darkModeColor: "text-amber-400",
  },
  {
    value: "inactive",
    label: "Inactive",
    icon: CheckCircledIcon,
    lightModeColor: "text-emerald-600",
    darkModeColor: "text-emerald-400",
  },
  {
    value: "activating",
    label: "Activating",
    icon: StopwatchIcon,
    lightModeColor: "text-amber-500",
    darkModeColor: "text-amber-400",
  },
];

/*
Differences Marinade vs Native/Liquid

Stake Account: Active, Deactivating, Inactive
Ticket: Pending, Claimable

Stake:
* Service:
 1 Native
 * long-term: provide validator selection interface (list validator) -> promote glam validator
 * short-term: input field for pub key

 2 Marinade - ok
 Marinade Native - same as native

3 all below -> select LST in question,
 Solana single-validator
 Solana multi-validator
 Sanctum single-validator
 Sanctum multi-validator

 change service to have Native, Native Marinade, Liquid Marinade, Liquid -> liquid expand to LST search command box (same as asset input)

 */
