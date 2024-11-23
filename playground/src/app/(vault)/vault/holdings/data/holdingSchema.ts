import { z } from "zod";

export const holdingSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  mint: z.string(),
  ata: z.string(),
  price: z.number(),
  balance: z.number(),
  decimals: z.number(),
  notional: z.number(),
  logoURI: z.string(),
  location: z.string(),
});

export type Holding = z.infer<typeof holdingSchema>;
