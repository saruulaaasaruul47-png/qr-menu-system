import { env } from "../../../../shared/config/env.js";
import { authMiddleware, publicRoute } from "../middlewares/auth.middleware.js";
import { proxy } from "../utils/proxy.js";

const api = "/api/v1";

const gatewayRoutes = [
  {
    service: "auth",
    targets: "authServiceUrls",
    routes: [
      { path: "/auth/register", upstream: "/auth", public: true },
      { path: "/auth/login", upstream: "/auth", public: true },
      { path: "/auth/refresh-token", upstream: "/auth", public: true },
      { path: "/auth/forgot-password", upstream: "/auth", public: true },
      { path: "/auth/verify-reset-code", upstream: "/auth", public: true },
      { path: "/auth/reset-password", upstream: "/auth", public: true },
      { path: "/auth", upstream: "/auth" },
      { path: "/employees", upstream: "/employees" },
    ],
  },
  {
    service: "restaurant",
    targets: "restaurantServiceUrls",
    routes: [
      { path: "/restaurants/public", proxyRoot: "/restaurants", upstream: "/restaurants", public: true },
      { path: "/restaurants", upstream: "/restaurants" },
      { path: "/tables", upstream: "/tables" },
      { path: "/subscriptions", upstream: "/subscriptions" },
    ],
  },
  {
    service: "menu",
    targets: "menuServiceUrls",
    routes: [
      { path: "/categories/public", proxyRoot: "/categories", upstream: "/categories", public: true },
      { path: "/foods/public", proxyRoot: "/foods", upstream: "/foods", public: true },
      { path: "/categories", upstream: "/categories" },
      { path: "/foods", upstream: "/foods" },
      { path: "/modifier-groups", proxyRoot: "", upstream: "" },
      { path: "/modifier-options", proxyRoot: "", upstream: "" },
    ],
  },
  {
    service: "order",
    targets: "orderServiceUrls",
    routes: [
      { path: "/coupons/public/validate", proxyRoot: "/coupons", upstream: "/coupons", public: true },
      { path: "/coupons", upstream: "/coupons" },
      { path: "/orders/guest", proxyRoot: "/orders", upstream: "/orders", public: true },
      { path: "/orders", upstream: "/orders" },
    ],
  },
  {
    service: "payment",
    targets: "paymentServiceUrls",
    routes: [
      { path: "/payments/webhooks", proxyRoot: "/payments", upstream: "/payments", public: true },
      { path: "/payments/stripe/webhook", proxyRoot: "/payments", upstream: "/payments", public: true },
      { path: "/payments/stripe/order-checkout", proxyRoot: "/payments", upstream: "/payments", public: true },
      { path: "/payments/demo", proxyRoot: "/payments", upstream: "/payments", public: true },
      { path: "/payments/:paymentId/status", proxyRoot: "/payments", upstream: "/payments", public: true },
      { path: "/payments", upstream: "/payments" },
    ],
  },
  {
    service: "notification",
    targets: "notificationServiceUrls",
    routes: [
      { path: "/waiter-calls", upstream: "/waiter-calls", public: true },
      { path: "/notifications", upstream: "/notifications" },
      { path: "/emails", upstream: "/emails" },
    ],
  },
  {
    service: "analytics",
    targets: "analyticsServiceUrls",
    routes: [
      { path: "/analytics/events", proxyRoot: "/analytics", upstream: "/analytics", public: true },
      { path: "/analytics", upstream: "/analytics" },
    ],
  },
  {
    service: "qr",
    targets: "qrServiceUrls",
    routes: [
      { method: "get", path: "/qr/:id/scan", proxyRoot: "/qr", upstream: "/qr", public: true },
      { path: "/qr", upstream: "/qr" },
    ],
  },
  {
    service: "loyalty",
    targets: "loyaltyServiceUrls",
    routes: [
      { path: "/loyalty/points", proxyRoot: "/loyalty", upstream: "/loyalty", public: true },
      { path: "/loyalty/public", proxyRoot: "/loyalty", upstream: "/loyalty", public: true },
      { path: "/loyalty", upstream: "/loyalty" },
    ],
  },
  {
    service: "audit",
    targets: "auditServiceUrls",
    routes: [
      { path: "/audit-logs", upstream: "/audit-logs" },
      { path: "/event-outbox", upstream: "/event-outbox" },
    ],
  },
];

const registerRoute = (app, { targets, route }) => {
  const method = route.method || "use";
  const publicPath = `${api}${route.path}`;
  const proxyRoot = route.proxyRoot ?? route.path;
  const middleware = route.public ? publicRoute : authMiddleware;

  app[method](publicPath, middleware, proxy(`${api}${proxyRoot}`, env[targets], route.upstream));
};

export const registerGatewayRoutes = (app) => {
  gatewayRoutes.forEach((group) => {
    group.routes.forEach((route) => registerRoute(app, { targets: group.targets, route }));
  });
};
