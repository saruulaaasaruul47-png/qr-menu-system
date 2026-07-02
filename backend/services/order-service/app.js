import { env } from "../../shared/config/env.js";
import { tenantRateLimiter } from "../../shared/middlewares/rateLimiters.js";
import { createServiceApp, listenService } from "../../shared/http/serviceApp.js";
import { couponRouter } from "./src/routes/coupon.routes.js";
import { orderRouter } from "./src/routes/order.routes.js";

const app = createServiceApp({
  serviceName: "order-service",
  rateLimiter: tenantRateLimiter,
  routes: [
    { path: "/orders", handlers: [orderRouter] },
    { path: "/coupons", handlers: [couponRouter] },
  ],
});

listenService(app, { displayName: "Order service", port: env.orderServicePort });
