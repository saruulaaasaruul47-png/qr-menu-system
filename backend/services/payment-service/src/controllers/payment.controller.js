import asyncHandler from "express-async-handler";
import { auditService } from "../../../../shared/services/audit.service.js";
import { HttpError } from "../../../../shared/utils/httpError.js";
import { sendSuccess } from "../../../../shared/utils/response.js";
import { paymentService } from "../services/payment.service.js";

const paymentIdFromRequest = (req) => req.validated.params?.paymentId || req.validated.body.paymentId;

export const createPayment = asyncHandler(async (req, res) => {
  sendSuccess(res, await paymentService.create(req.user, req.validated.body), 201);
});

export const createDemoPayment = asyncHandler(async (req, res) => {
  sendSuccess(res, await paymentService.createDemo(req.validated.body), 201);
});

export const confirmDemoPayment = asyncHandler(async (req, res) => {
  sendSuccess(res, await paymentService.confirmDemo(paymentIdFromRequest(req)));
});

export const failDemoPayment = asyncHandler(async (req, res) => {
  sendSuccess(res, await paymentService.failDemo(paymentIdFromRequest(req)));
});

export const refundDemoPayment = asyncHandler(async (req, res) => {
  sendSuccess(res, await paymentService.refundDemo(paymentIdFromRequest(req)));
});

export const getPaymentStatus = asyncHandler(async (req, res) => {
  sendSuccess(res, await paymentService.getStatus(req.validated.params.paymentId));
});

export const listPayments = asyncHandler(async (req, res) => {
  sendSuccess(res, await paymentService.list(req.user));
});

export const getPayment = asyncHandler(async (req, res) => {
  sendSuccess(res, await paymentService.get(req.user, req.validated.params.id));
});

export const createStripeCheckout = asyncHandler(async (req, res) => {
  sendSuccess(res, await paymentService.createStripeCheckout(req.user, req.validated.body));
});

export const createStripeOrderCheckout = asyncHandler(async (req, res) => {
  sendSuccess(res, await paymentService.createStripeOrderCheckout(req.validated.body), 201);
});

export const stripeWebhook = asyncHandler(async (req, res) => {
  sendSuccess(res, await paymentService.handleStripeWebhook(req.body, req.headers["stripe-signature"]));
});

export const handleWebhook = asyncHandler(async (req, res) => {
  if (!paymentService.verifyWebhookSignature(req)) throw new HttpError(401, "Invalid webhook signature");

  const payment = await paymentService.handleWebhook(req.validated.body);
  await auditService.record({
    req,
    action: payment.status === "REFUNDED" ? "PAYMENT_REFUNDED" : "PAYMENT_UPDATED",
    entity: "Payment",
    entityId: payment.id,
    newValue: payment,
    restaurantId: payment.restaurantId,
  });
  sendSuccess(res, payment);
});
