import {
  CheckCircledIcon,
  CrossCircledIcon,
  StopwatchIcon,
} from "@radix-ui/react-icons";

export const types = [
  {
    value: "native",
    label: "Native",
  },
  {
    value: "liquid",
    label: "Liquid",
  },
  {
    value: "stake",
    label: "Stake",
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
  },
  {
    value: "claimable",
    label: "Claimable",
    icon: CheckCircledIcon,
  },
  {
    value: "active",
    label: "Active",
    icon: CrossCircledIcon,
  },
  {
    value: "deactivating",
    label: "Deactivating",
    icon: StopwatchIcon,
  },
  {
    value: "inactive",
    label: "Inactive",
    icon: CheckCircledIcon,
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
