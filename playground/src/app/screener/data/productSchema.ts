import { z } from "zod";

export const productSchema = z.object({
  address: z.string(),
  name: z.string(),
  symbol: z.string(),
  baseAsset: z.string(),
  inception: z.string(),
  status: z.string(),
});

export type Product = z.infer<typeof productSchema>;
