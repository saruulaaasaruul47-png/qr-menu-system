import express from "express";
import { env } from "../../shared/config/env.js";
import { tenantRateLimiter } from "../../shared/middlewares/rateLimiters.js";
import { createServiceApp, listenService } from "../../shared/http/serviceApp.js";
import { paymentRouter } from "./src/routes/payment.routes.js";
import { stripeWebhook } from "./src/controllers/payment.controller.js";

const app = createServiceApp({
  serviceName: "payment-service",
  rateLimiter: tenantRateLimiter,
  preJsonRoutes: [
    { method: "post", path: "/payments/stripe/webhook", handlers: [express.raw({ type: "application/json" }), stripeWebhook] },
  ],
  routes: [{ path: "/payments", handlers: [paymentRouter] }],
});

listenService(app, { displayName: "Payment service", port: env.paymentServicePort });
