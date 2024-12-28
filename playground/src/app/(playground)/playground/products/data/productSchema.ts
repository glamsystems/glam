import { z } from "zod";

export const productSchema = z.object({
  id: z.string(),
  sparkleKey: z.string(),
  name: z.string(),
  symbol: z.string(),
  baseAsset: z.string(),
  inception: z.string(),
  status: z.string(),
  product: z.string(),
});

export type Product = z.infer<typeof productSchema>;
