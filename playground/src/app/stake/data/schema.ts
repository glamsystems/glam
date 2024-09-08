import { z } from "zod";

export const serviceOptions = [
  "Native",
  "Marinade Native",
  "Stakepool",
] as const;

export const stakeServiceSchema = z
  .object({
    service: z.enum(serviceOptions),
    amountIn: z.number().min(0),
    amountInAsset: z.string(),
    validatorAddress: z.string().optional(),
    stakepool: z.string(),
  })
  .refine(
    (data) => {
      if (data.service === "Native") {
        return !!data.validatorAddress;
      }
      return true;
    },
    {
      message: "Validator Address is required for Native service",
      path: ["validatorAddress"],
    }
  );

export const ticketOrStakeSchema = z
  .object({
    publicKey: z.string(),
    lamports: z.number().nonnegative(),
    service: z.string(),
    status: z.string(),
    type: z.enum(["ticket", "account"]),
    validator: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "account" && !data.validator) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Validator is required for accounts of type 'account'.",
        path: ["validator"],
      });
    }
  });

export type StakeService = z.infer<typeof stakeServiceSchema>;
export type TicketOrStake = z.infer<typeof ticketOrStakeSchema>;
