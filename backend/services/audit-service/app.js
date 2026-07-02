import { env } from "../../shared/config/env.js";
import { tenantRateLimiter } from "../../shared/middlewares/rateLimiters.js";
import { createServiceApp, listenService } from "../../shared/http/serviceApp.js";
import { auditRouter } from "./src/routes/audit.routes.js";
import { eventOutboxRouter } from "./src/routes/eventOutbox.routes.js";

const app = createServiceApp({
  serviceName: "audit-service",
  rateLimiter: tenantRateLimiter,
  useUrlencoded: false,
  routes: [
    { path: "/audit-logs", handlers: [auditRouter] },
    { path: "/event-outbox", handlers: [eventOutboxRouter] },
  ],
});

listenService(app, { displayName: "Audit service", port: env.auditServicePort });
