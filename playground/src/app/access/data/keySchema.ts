import { z } from "zod";

export const keySchema = z.object({
  pubkey: z.string(),
  label: z.string(),
  tags: z.array(z.enum(["stake", "swap", "trade", "lend"])),
});

export type Key = z.infer<typeof keySchema>;
