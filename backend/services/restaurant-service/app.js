import { env } from "../../shared/config/env.js";
import { tenantRateLimiter } from "../../shared/middlewares/rateLimiters.js";
import { createServiceApp, listenService } from "../../shared/http/serviceApp.js";
import { restaurantRouter } from "./src/routes/restaurant.routes.js";
import { tableRouter } from "./src/routes/table.routes.js";
import { subscriptionRouter } from "./src/routes/subscription.routes.js";

const app = createServiceApp({
  serviceName: "restaurant-service",
  rateLimiter: tenantRateLimiter,
  routes: [
    { path: "/restaurants", handlers: [restaurantRouter] },
    { path: "/tables", handlers: [tableRouter] },
    { path: "/subscriptions", handlers: [subscriptionRouter] },
  ],
});

listenService(app, { displayName: "Restaurant service", port: env.restaurantServicePort });
