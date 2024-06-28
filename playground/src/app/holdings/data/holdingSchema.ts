import { z } from "zod"

export const holdingSchema = z.object({
    asset: z.string(),
    location: z.string(),
    balance: z.number(),
    notional: z.number()
})

export type Holding = z.infer<typeof holdingSchema>