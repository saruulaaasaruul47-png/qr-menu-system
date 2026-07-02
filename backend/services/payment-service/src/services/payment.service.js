import crypto from "crypto";
import { ORDER_STATUS, PAYMENT_STATUS } from "../../../../shared/constants/domain.js";
import { EVENTS } from "../../../../shared/constants/events.js";
import { ROLES } from "../../../../shared/constants/permissions.js";
import { publishEvent } from "../../../../shared/utils/eventBus.js";
import { HttpError } from "../../../../shared/utils/httpError.js";
import { restoreInventoryForOrder } from "../../../../shared/utils/inventory.js";
import { logger } from "../../../../shared/utils/logger.js";
import { ensureTenantAccess } from "../../../../shared/utils/tenant.js";
import { paymentRepository } from "../repositories/payment.repository.js";
import { stripeService } from "./stripe.service.js";
import { createDemoTransactionId, createInvoiceNo, createInvoiceUrl } from "../utils/paymentInvoice.js";

const DEMO_PROVIDER = "DEMO";
const TERMINAL_FAILED_STATUSES = [PAYMENT_STATUS.FAILED, PAYMENT_STATUS.REFUNDED];

const publishPaymentEvents = async (payment) => {
  const order = await paymentRepository.findOrderSession(payment.orderId);
  const targets = order?.guestSessionId ? [`customer:${order.guestSessionId}`] : [];

  if (payment.status === PAYMENT_STATUS.SUCCESS) {
    await publishEvent(EVENTS.PAYMENT_SUCCESS, {
      restaurantId: payment.restaurantId,
      paymentId: payment.id,
      orderId: payment.orderId,
      amount: payment.amount,
      sessionToken: order?.guestSessionId,
      targets,
    });
  }

  if (payment.status === PAYMENT_STATUS.FAILED) {
    await publishEvent(EVENTS.PAYMENT_FAILED, {
      restaurantId: payment.restaurantId,
      paymentId: payment.id,
      orderId: payment.orderId,
      sessionToken: order?.guestSessionId,
      targets,
    });
  }
};

const cancelOrderAndRestoreInventory = async (tx, payment, previousStatus) => {
  if (TERMINAL_FAILED_STATUSES.includes(previousStatus)) return;
  await tx.order.update({ where: { id: payment.orderId }, data: { status: ORDER_STATUS.CANCELLED } });
  await restoreInventoryForOrder(tx, payment.orderId);
};

const updateDemoPaymentStatus = async (paymentId, status) => {
  const payment = await paymentRepository.transaction(async (tx) => {
    const current = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!current) throw new HttpError(404, "Payment not found");
    if (current.status === status) return current;
    if (current.status !== PAYMENT_STATUS.PENDING && status !== PAYMENT_STATUS.REFUNDED) return current;

    const updated = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status,
        transactionId: status === PAYMENT_STATUS.PENDING ? current.transactionId : current.transactionId || createDemoTransactionId(),
        providerRef: `${DEMO_PROVIDER}:${status}`,
      },
    });

    if (TERMINAL_FAILED_STATUSES.includes(status)) {
      await cancelOrderAndRestoreInventory(tx, updated, current.status);
    }

    return updated;
  });

  await publishPaymentEvents(payment);
  return payment;
};

const scheduleDemoResolution = (paymentId) => {
  const delay = 3000 + Math.floor(Math.random() * 2000);
  setTimeout(() => {
    const status = Math.random() > 0.18 ? PAYMENT_STATUS.SUCCESS : PAYMENT_STATUS.FAILED;
    updateDemoPaymentStatus(paymentId, status).catch((error) => {
      logger.error({ message: "Demo payment auto-resolution failed", paymentId, status, error });
    });
  }, delay);
};

export const paymentService = {
  verifyWebhookSignature(req) {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (!secret) return true;

    const signature = req.headers["x-webhook-signature"];
    const expected = crypto.createHmac("sha256", secret).update(JSON.stringify(req.body)).digest("hex");
    return signature === expected;
  },

  async create(user, payload) {
    const order = await paymentRepository.findOrderWithPayment(payload.orderId);
    if (!order) throw new HttpError(404, "Order not found");
    ensureTenantAccess(user, order.restaurantId);
    if (order.payment) return order.payment;

    return paymentRepository.createPayment({
      orderId: order.id,
      restaurantId: order.restaurantId,
      provider: payload.provider,
      amount: order.totalAmount,
      invoiceUrl: createInvoiceUrl(order.id),
      invoiceNo: createInvoiceNo(),
      providerRef: `ORDER:${payload.provider}`,
    });
  },

  async createDemo(payload) {
    const { orderId, autoResolve } = payload;
    const order = await paymentRepository.findOrderWithPayment(orderId);
    if (!order) throw new HttpError(404, "Order not found");

    if (order.payment) {
      if (order.payment.status === PAYMENT_STATUS.SUCCESS) return order.payment;

      const payment = await paymentRepository.transaction(async (tx) => {
        const updated = await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            status: PAYMENT_STATUS.PENDING,
            transactionId: null,
            providerRef: `${DEMO_PROVIDER}:${PAYMENT_STATUS.PENDING}`,
          },
        });
        await tx.order.update({ where: { id: order.id }, data: { status: ORDER_STATUS.PENDING } });
        return updated;
      });

      if (autoResolve !== false) scheduleDemoResolution(payment.id);
      return payment;
    }

    const payment = await paymentRepository.createPayment({
      orderId: order.id,
      restaurantId: order.restaurantId,
      provider: DEMO_PROVIDER,
      amount: order.totalAmount,
      status: PAYMENT_STATUS.PENDING,
      invoiceUrl: createInvoiceUrl(order.id),
      invoiceNo: createInvoiceNo(),
      providerRef: `${DEMO_PROVIDER}:${PAYMENT_STATUS.PENDING}`,
    });

    if (autoResolve !== false) scheduleDemoResolution(payment.id);
    return payment;
  },

  confirmDemo(paymentId) {
    return updateDemoPaymentStatus(paymentId, PAYMENT_STATUS.SUCCESS);
  },

  failDemo(paymentId) {
    return updateDemoPaymentStatus(paymentId, PAYMENT_STATUS.FAILED);
  },

  async refundDemo(paymentId) {
    const payment = await paymentRepository.findPayment(paymentId);
    if (!payment) throw new HttpError(404, "Payment not found");
    if (payment.status !== PAYMENT_STATUS.SUCCESS) throw new HttpError(400, "Only successful payments can be refunded");
    return updateDemoPaymentStatus(paymentId, PAYMENT_STATUS.REFUNDED);
  },

  async getStatus(paymentId) {
    const payment = await paymentRepository.findPaymentStatus(paymentId);
    if (!payment) throw new HttpError(404, "Payment not found");
    return payment;
  },

  list(user) {
    const where = user.role === ROLES.SUPER_ADMIN ? {} : { restaurantId: user.restaurantId };
    return paymentRepository.listPayments(where);
  },

  async get(user, paymentId) {
    const payment = await paymentRepository.findPayment(paymentId);
    if (!payment) throw new HttpError(404, "Payment not found");
    ensureTenantAccess(user, payment.restaurantId);
    return payment;
  },

  createStripeCheckout(user, payload) {
    ensureTenantAccess(user, payload.restaurantId);
    return stripeService.createCheckoutSession({
      restaurantId: payload.restaurantId,
      planKey: payload.planKey,
      userEmail: user.email,
    });
  },

  createStripeOrderCheckout(payload) {
    return stripeService.createOrderCheckoutSession({ orderId: payload.orderId });
  },

  async handleStripeWebhook(rawBody, signature) {
    return stripeService.handleWebhook(rawBody, signature);
  },

  async handleWebhook(payload) {
    const payment = await paymentRepository.transaction(async (tx) => {
      const current = await tx.payment.findUnique({ where: { id: payload.paymentId } });
      if (!current) throw new HttpError(404, "Payment not found");

      const updated = await tx.payment.update({
        where: { id: payload.paymentId },
        data: {
          status: payload.status,
          transactionId: payload.transactionId,
        },
      });

      if (payload.status === PAYMENT_STATUS.SUCCESS) {
        await tx.order.update({ where: { id: updated.orderId }, data: { status: ORDER_STATUS.COMPLETED } });
      }
      if (TERMINAL_FAILED_STATUSES.includes(payload.status)) {
        await cancelOrderAndRestoreInventory(tx, updated, current.status);
      }

      return updated;
    });

    await publishPaymentEvents(payment);
    return payment;
  },
};
