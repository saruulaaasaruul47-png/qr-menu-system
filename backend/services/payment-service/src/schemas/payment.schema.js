import { z } from "zod";

export const createPaymentSchema = z.object({
  body: z.object({
    orderId: z.string().uuid(),
    provider: z.enum(["QPay", "SocialPay", "MonPay", "Card", "DEMO"]),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const demoPaymentSchema = z.object({
  body: z.object({
    orderId: z.string().uuid(),
    provider: z.enum(["DEMO", "Demo Payment"]).default("DEMO").optional(),
    autoResolve: z.boolean().default(true).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const demoPaymentIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ paymentId: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const demoPaymentActionSchema = z.object({
  body: z.object({ paymentId: z.string().uuid() }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const paymentIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const webhookSchema = z.object({
  body: z.object({
    paymentId: z.string().uuid(),
    status: z.enum(["SUCCESS", "FAILED", "REFUNDED"]),
    transactionId: z.string().min(3).optional(),
  }),
  params: z.object({ provider: z.string().min(2) }),
  query: z.object({}).optional(),
});

export const stripeCheckoutSchema = z.object({
  body: z.object({
    restaurantId: z.string().uuid(),
    planKey: z.enum(["MONTHLY", "YEARLY"]),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const stripeOrderCheckoutSchema = z.object({
  body: z.object({
    orderId: z.string().uuid(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
