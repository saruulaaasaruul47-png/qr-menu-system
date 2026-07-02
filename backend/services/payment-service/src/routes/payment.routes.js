import { Router } from "express";
import { authenticate, requirePermissions } from "../../../../shared/middlewares/auth.js";
import { validate } from "../../../../shared/middlewares/validate.js";
import { PERMISSIONS } from "../../../../shared/constants/permissions.js";
import { emptyRequestSchema } from "../../../../shared/schemas/request.schema.js";
import {
  confirmDemoPayment,
  createDemoPayment,
  createPayment,
  createStripeCheckout,
  createStripeOrderCheckout,
  failDemoPayment,
  getPayment,
  getPaymentStatus,
  handleWebhook,
  listPayments,
  refundDemoPayment,
} from "../controllers/payment.controller.js";
import {
  createPaymentSchema,
  demoPaymentActionSchema,
  demoPaymentIdSchema,
  demoPaymentSchema,
  paymentIdSchema,
  stripeCheckoutSchema,
  stripeOrderCheckoutSchema,
  webhookSchema,
} from "../schemas/payment.schema.js";

export const paymentRouter = Router();

paymentRouter.post("/stripe/checkout", authenticate, requirePermissions(PERMISSIONS.VERIFY_PAYMENT), validate(stripeCheckoutSchema), createStripeCheckout);
paymentRouter.post("/stripe/order-checkout", validate(stripeOrderCheckoutSchema), createStripeOrderCheckout);

paymentRouter.post("/demo/create", validate(demoPaymentSchema), createDemoPayment);
paymentRouter.post("/demo/confirm", validate(demoPaymentActionSchema), confirmDemoPayment);
paymentRouter.post("/demo/fail", validate(demoPaymentActionSchema), failDemoPayment);
paymentRouter.post("/demo/refund", validate(demoPaymentActionSchema), refundDemoPayment);
paymentRouter.post("/demo/confirm/:paymentId", validate(demoPaymentIdSchema), confirmDemoPayment);
paymentRouter.post("/demo/fail/:paymentId", validate(demoPaymentIdSchema), failDemoPayment);
paymentRouter.post("/demo/refund/:paymentId", validate(demoPaymentIdSchema), refundDemoPayment);
paymentRouter.get("/:paymentId/status", validate(demoPaymentIdSchema), getPaymentStatus);
paymentRouter.post("/", authenticate, requirePermissions(PERMISSIONS.VERIFY_PAYMENT), validate(createPaymentSchema), createPayment);
paymentRouter.get("/", authenticate, requirePermissions(PERMISSIONS.VERIFY_PAYMENT), validate(emptyRequestSchema), listPayments);
paymentRouter.get("/:id", authenticate, requirePermissions(PERMISSIONS.VERIFY_PAYMENT), validate(paymentIdSchema), getPayment);
paymentRouter.post("/webhooks/:provider", validate(webhookSchema), handleWebhook);
