import { z } from "zod";

export const sendEmailSchema = z.object({
  body: z.object({
    restaurantId: z.string().uuid(),
    to: z.string().email(),
    subject: z.string().min(2).max(160),
    template: z.enum([
      "ORDER_CONFIRMATION",
      "ORDER_READY",
      "PAYMENT_SUCCESS",
      "RECEIPT",
      "REFUND_CONFIRMATION",
      "EMPLOYEE_INVITATION",
      "PASSWORD_RESET",
      "PASSWORD_CHANGED",
      "SUBSCRIPTION_REMINDER",
      "SECURITY_ALERT",
    ]),
    data: z.record(z.string(), z.unknown()).default({}),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
