import { z } from "zod";

export const eventOutboxQuerySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    status: z.enum(["PENDING", "PUBLISHED", "FAILED"]).optional(),
    type: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  }).optional(),
});

export const eventOutboxIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});
