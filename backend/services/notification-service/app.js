import { env } from "../../shared/config/env.js";
import { tenantRateLimiter } from "../../shared/middlewares/rateLimiters.js";
import { createServiceApp, listenService } from "../../shared/http/serviceApp.js";
import { notificationRouter } from "./src/routes/notification.routes.js";
import { waiterCallRouter } from "./src/routes/waiterCall.routes.js";
import { emailRouter } from "./src/routes/email.routes.js";

const app = createServiceApp({
  serviceName: "notification-service",
  rateLimiter: tenantRateLimiter,
  routes: [
    { path: "/notifications", handlers: [notificationRouter] },
    { path: "/waiter-calls", handlers: [waiterCallRouter] },
    { path: "/emails", handlers: [emailRouter] },
  ],
});

listenService(app, { displayName: "Notification service", port: env.notificationServicePort });
