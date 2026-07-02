import { z } from "zod";

export const ingestEventSchema = z.object({
  body: z.object({
    restaurantId: z.string().uuid(),
    type: z.string().min(2).max(100),
    payload: z.record(z.string(), z.unknown()).default({}),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const metricsQuerySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    restaurantId: z.string().uuid().optional(),
  }).optional(),
});
