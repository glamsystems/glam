import { z } from "zod";

export const serviceOptions = [
  "Native Staking",
  // "Marinade Native",
  "Liquid Staking",
] as const;

export const stakeServiceSchema = z
  .object({
    service: z.enum(serviceOptions),
    amountIn: z.number().gte(0),
    amountInAsset: z.string(),
    validatorAddress: z.string().optional(), // native staking
    stakePool: z.string().optional(), // liquid staking
    poolTokenSymbol: z.string().optional(), // liquid staking
  })
  .refine(
    (data) => {
      if (data.service === "Native Staking") {
        return !!data.validatorAddress;
      }
      return true;
    },
    {
      message: "Validator Address is required for Native Staking",
      path: ["validatorAddress"],
    },
  )
  .refine(
    (data) => {
      if (data.service === "Liquid Staking") {
        return !!data.stakePool;
      }
      return true;
    },
    {
      message: "Stake pool is required for Liquid Staking",
      path: ["stakePool"],
    },
  );

export const ticketOrStakeSchema = z
  .object({
    publicKey: z.string(),
    lamports: z.number().nonnegative(),
    service: z.string(),
    status: z.string(),
    type: z.enum(["ticket", "stake-account"]),
    validator: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "stake-account" && !data.validator) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Validator is required for accounts of type 'stake-account'.",
        path: ["validator"],
      });
    }
  });

export type StakeService = z.infer<typeof stakeServiceSchema>;
export type TicketOrStake = z.infer<typeof ticketOrStakeSchema>;
