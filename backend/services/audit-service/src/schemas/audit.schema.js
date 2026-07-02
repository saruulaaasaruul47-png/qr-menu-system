import { z } from "zod";

export const auditQuerySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    restaurantId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    action: z.string().optional(),
    entity: z.string().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  }).optional(),
});
