import { z } from "zod";

export const ticketSchema = z.object({
  publicKey: z.string(),
  service: z.string(),
  status: z.string(),
  label: z.string(),
});

export type Ticket = z.infer<typeof ticketSchema>;
