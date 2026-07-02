import { env } from "../../shared/config/env.js";
import { tenantRateLimiter } from "../../shared/middlewares/rateLimiters.js";
import { createServiceApp, listenService } from "../../shared/http/serviceApp.js";
import { analyticsRouter } from "./src/routes/analytics.routes.js";

const app = createServiceApp({
  serviceName: "analytics-service",
  rateLimiter: tenantRateLimiter,
  routes: [{ path: "/analytics", handlers: [analyticsRouter] }],
});

listenService(app, { displayName: "Analytics service", port: env.analyticsServicePort });
