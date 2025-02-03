import { z } from "zod";

export const assetSchema = z.object({
  address: z.string(),
  //chainId: z.number(),
  decimals: z.number(),
  name: z.string(),
  symbol: z.string(),
  logoURI: z.string(),
  //tags: z.object()
  //extensions: z.object()
});

export type Asset = z.infer<typeof assetSchema>;
