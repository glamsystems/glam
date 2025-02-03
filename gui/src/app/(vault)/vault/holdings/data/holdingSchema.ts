import { z } from "zod";

export const holdingSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  mint: z.string(),
  ata: z.string(),
  price: z.number(),
  amount: z.string(), // raw
  balance: z.number(), // ui
  decimals: z.number(),
  notional: z.number(),
  logoURI: z.string(),
  location: z.string(),
  lst: z.boolean().optional().default(false),
});

export type Holding = z.infer<typeof holdingSchema>;
