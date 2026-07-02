import { env } from "../../shared/config/env.js";
import { tenantRateLimiter } from "../../shared/middlewares/rateLimiters.js";
import { createServiceApp, listenService } from "../../shared/http/serviceApp.js";
import { qrRouter } from "./src/routes/qr.routes.js";

const app = createServiceApp({
  serviceName: "qr-service",
  rateLimiter: tenantRateLimiter,
  routes: [{ path: "/qr", handlers: [qrRouter] }],
});

listenService(app, { displayName: "QR service", port: env.qrServicePort });
