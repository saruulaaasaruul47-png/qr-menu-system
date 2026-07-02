import Stripe from "stripe";
import { prisma } from "../../../../shared/config/prisma.js";
import { cache } from "../../../../shared/utils/cache.js";
import { env } from "../../../../shared/config/env.js";
import { HttpError } from "../../../../shared/utils/httpError.js";
import { createInvoiceNo, createInvoiceUrl } from "../utils/paymentInvoice.js";

const PLAN_CATALOG = Object.freeze({
  MONTHLY: {
    plan: "STANDARD",
    foodLimit: 200,
    label: "Monthly plan",
    amountUsd: 1500,
    days: 30,
  },
  YEARLY: {
    plan: "PREMIUM",
    foodLimit: 999999,
    label: "Yearly plan",
    amountUsd: 15000,
    days: 365,
  },
});

const getStripe = () => {
  if (!env.stripeSecretKey) throw new HttpError(503, "Stripe is not configured. Set STRIPE_SECRET_KEY in backend/.env");
  return new Stripe(env.stripeSecretKey);
};

export const stripeService = {
  async createCheckoutSession({ restaurantId, planKey, userEmail }) {
    const catalog = PLAN_CATALOG[planKey];
    if (!catalog) throw new HttpError(400, "Invalid subscription plan");

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: userEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `BrewNest ${catalog.label}`,
              description: `${catalog.days} days subscription for restaurant ${restaurantId}`,
            },
            unit_amount: catalog.amountUsd,
          },
          quantity: 1,
        },
      ],
      metadata: {
        restaurantId,
        plan: catalog.plan,
        foodLimit: String(catalog.foodLimit),
        planKey,
        days: String(catalog.days),
      },
      success_url: `${env.appPublicUrl}/staff?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.appPublicUrl}/staff?billing=cancelled`,
    });

    return { sessionId: session.id, url: session.url };
  },

  async createOrderCheckoutSession({ orderId }) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        restaurant: { select: { name: true } },
      },
    });
    if (!order) throw new HttpError(404, "Order not found");
    if (order.payment?.status === "SUCCESS") return { payment: order.payment, paid: true };

    const amount = Math.max(0, Math.round(Number(order.totalAmount || 0) * env.stripeOrderAmountMultiplier));
    if (amount <= 0) throw new HttpError(400, "Order amount must be greater than zero");

    const payment = order.payment || await prisma.payment.create({
      data: {
        orderId: order.id,
        restaurantId: order.restaurantId,
        provider: "STRIPE",
        amount: order.totalAmount,
        status: "PENDING",
        invoiceUrl: createInvoiceUrl(order.id),
        invoiceNo: createInvoiceNo(),
        providerRef: "STRIPE:PENDING",
      },
    });

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: env.stripeOrderCurrency,
            product_data: {
              name: `${order.restaurant?.name || "Restaurant"} QR order`,
              description: `Order ${order.id}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "ORDER_PAYMENT",
        restaurantId: order.restaurantId,
        orderId: order.id,
        paymentId: payment.id,
        guestSessionId: order.guestSessionId,
      },
      success_url: `${env.appPublicUrl}/order/status/${order.guestSessionId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.appPublicUrl}/order/status/${order.guestSessionId}?payment=cancelled`,
    });

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        provider: "STRIPE",
        status: "PENDING",
        providerRef: session.id,
      },
    });

    return { payment: updatedPayment, sessionId: session.id, url: session.url };
  },

  async handleWebhook(rawBody, signature) {
    if (!env.stripeWebhookSecret) throw new HttpError(503, "Stripe webhook secret is not configured");

    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const { type, restaurantId, plan, foodLimit, days, orderId, paymentId } = session.metadata || {};

      if (type === "ORDER_PAYMENT" && orderId && paymentId) {
        await prisma.$transaction(async (tx) => {
          const payment = await tx.payment.update({
            where: { id: paymentId },
            data: {
              status: "SUCCESS",
              transactionId: session.payment_intent || session.id,
              providerRef: session.id,
            },
          });

          await tx.order.update({
            where: { id: orderId },
            data: { status: "COMPLETED" },
          });

          return payment;
        });

        return { received: true };
      }

      if (!restaurantId || !plan) return { received: true };

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(days || 30));

      await prisma.subscription.upsert({
        where: { restaurantId },
        create: {
          restaurantId,
          plan,
          foodLimit: Number(foodLimit || 200),
          isActive: true,
          expiresAt,
        },
        update: {
          plan,
          foodLimit: Number(foodLimit || 200),
          isActive: true,
          expiresAt,
        },
      });

      cache.del(`restaurant:${restaurantId}`);
      cache.clearByPrefix("restaurants:list:");
    }

    return { received: true };
  },
};
