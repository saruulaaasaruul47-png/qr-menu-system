import { z } from "zod";

export const addPointsSchema = z.object({
  body: z.object({
    restaurantId: z.string().uuid(),
    phone: z.string().min(6).max(30).optional(),
    paymentId: z.string().uuid().optional(),
    amount: z.number().nonnegative(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const lookupLoyaltySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    restaurantId: z.string().uuid().optional(),
    phone: z.string().min(6).max(30).optional(),
  }).optional(),
});

export const publicLookupSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    restaurantId: z.string().uuid(),
    phone: z.string().min(6).max(30),
  }),
});

export const deleteLoyaltyDataSchema = z.object({
  body: z.object({
    restaurantId: z.string().uuid().optional(),
    phone: z.string().min(6).max(30),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
