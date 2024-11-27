import { z } from "zod";

export const holdersSchema = z.object({
  pubkey: z.string(),
  label: z.string(),
  frozen: z.boolean(),
  quantity: z.number().nonnegative(),
});

export type Key = z.infer<typeof holdersSchema>;
