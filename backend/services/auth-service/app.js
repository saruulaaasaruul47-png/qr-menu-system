import { env } from "../../shared/config/env.js";
import { authRateLimiter } from "../../shared/middlewares/rateLimiters.js";
import { createServiceApp, listenService } from "../../shared/http/serviceApp.js";
import { authRouter } from "./src/routes/auth.routes.js";
import { employeeRouter } from "./src/routes/employee.routes.js";

const app = createServiceApp({
  serviceName: "auth-service",
  rateLimiter: authRateLimiter,
  routes: [
    { path: "/auth", handlers: [authRouter] },
    { path: "/", handlers: [authRouter] },
    { path: "/employees", handlers: [employeeRouter] },
  ],
});

listenService(app, { displayName: "Auth service", port: env.authServicePort });
