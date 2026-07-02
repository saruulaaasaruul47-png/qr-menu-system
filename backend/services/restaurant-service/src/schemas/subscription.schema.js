import { z } from "zod";

export const upsertSubscriptionSchema = z.object({
  body: z.object({
    restaurantId: z.string().uuid(),
    plan: z.enum(["FREE", "STANDARD", "PREMIUM"]),
    foodLimit: z.number().int().positive(),
    isActive: z.boolean().optional(),
    expiresAt: z.string().datetime().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
