import { env } from "../../shared/config/env.js";
import { tenantRateLimiter } from "../../shared/middlewares/rateLimiters.js";
import { createServiceApp, listenService } from "../../shared/http/serviceApp.js";
import { loyaltyRouter } from "./src/routes/loyalty.routes.js";

const app = createServiceApp({
  serviceName: "loyalty-service",
  rateLimiter: tenantRateLimiter,
  routes: [{ path: "/loyalty", handlers: [loyaltyRouter] }],
});

listenService(app, { displayName: "Loyalty service", port: env.loyaltyServicePort });
