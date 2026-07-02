import { z } from "zod";

export const createOrderSchema = z.object({
  body: z.object({
    restaurantId: z.string().uuid(),
    tableId: z.string().min(1).max(120).optional(),
    guestSessionId: z.string().min(1).max(120),
    source: z.enum(["QR", "CASHIER", "WAITER"]).default("QR").optional(),
    note: z.string().max(500).optional(),
    customerPhone: z.string().min(6).max(30).optional(),
    couponCode: z.string().min(2).max(40).optional(),
    payment: z.object({
      provider: z.enum(["QPay", "SocialPay", "MonPay", "Card", "CASH", "CARD", "QPAY", "DEMO", "Demo Payment"]),
      transactionId: z.string().min(3).max(120).optional(),
    }).optional(),
    items: z.array(
      z.object({
        foodId: z.string().uuid(),
        quantity: z.number().int().positive(),
        modifierOptionIds: z.array(z.string().uuid()).optional(),
      }),
    ).min(1),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const listOrderSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    restaurantId: z.string().uuid().optional(),
    status: z.enum(["PENDING", "ACCEPTED", "PREPARING", "READY", "SERVED", "COMPLETED", "CANCELLED"]).optional(),
    guestSessionId: z.string().optional(),
  }).optional(),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(["ACCEPTED", "PREPARING", "READY", "SERVED", "COMPLETED", "CANCELLED"]),
  }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const orderIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const guestOrderStatusSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ guestSessionId: z.string().min(1).max(120) }),
  query: z.object({}).optional(),
});
