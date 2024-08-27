import { z } from "zod";

export const stakeServiceSchema = z.object({
  service: z.enum(["Marinade", "Native", "Jito"]),
  amountIn: z.number().nonnegative(),
  amountInAsset: z.string(),
});

export const ticketOrStakeSchema = z.object({
  publicKey: z.string(),
  service: z.string(),
  status: z.string(),
  label: z.string(),
});

export type StakeService = z.infer<typeof stakeServiceSchema>;
export type TicketOrStake = z.infer<typeof ticketOrStakeSchema>;
