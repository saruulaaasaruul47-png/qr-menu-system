import { z } from "zod";

const couponBody = z.object({
  restaurantId: z.string().uuid().optional(),
  code: z.string().min(2).max(40),
  type: z.enum(["PERCENT", "FIXED"]).default("PERCENT"),
  discountValue: z.coerce.number().positive(),
  minOrderAmount: z.coerce.number().nonnegative().optional(),
  maxDiscountAmount: z.coerce.number().positive().optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
});

export const listCouponSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({ restaurantId: z.string().uuid().optional() }).optional(),
});

export const createCouponSchema = z.object({
  body: couponBody,
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateCouponSchema = z.object({
  body: couponBody.partial(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const couponIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const validateCouponSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    restaurantId: z.string().uuid(),
    code: z.string().min(2).max(40),
    subtotal: z.coerce.number().nonnegative(),
  }),
});
