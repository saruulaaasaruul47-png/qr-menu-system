import { env } from "../../shared/config/env.js";
import { tenantRateLimiter } from "../../shared/middlewares/rateLimiters.js";
import { createServiceApp, listenService } from "../../shared/http/serviceApp.js";
import { categoryRouter } from "./src/routes/category.routes.js";
import { foodRouter } from "./src/routes/food.routes.js";
import { modifierRouter } from "./src/routes/modifier.routes.js";

const app = createServiceApp({
  serviceName: "menu-service",
  rateLimiter: tenantRateLimiter,
  routes: [
    { path: "/categories", handlers: [categoryRouter] },
    { path: "/foods", handlers: [foodRouter] },
    { path: "/", handlers: [modifierRouter] },
  ],
});

listenService(app, { displayName: "Menu service", port: env.menuServicePort });
