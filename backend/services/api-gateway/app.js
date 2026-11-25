import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createServer } from "http";
import { env } from "../../shared/config/env.js";
import { logger } from "../../shared/utils/logger.js";
import { tenantRateLimiter } from "../../shared/middlewares/rateLimiters.js";
import { errorHandler, notFoundHandler } from "../../shared/middlewares/errorHandler.js";
import { securityHeaders } from "../../shared/middlewares/security.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { registerGatewayRoutes } from "./src/routes/gateway.routes.js";
import { openApiHtml, openApiSpec } from "./src/docs/openapi.js";
import { initRealtime } from "./src/realtime/socket.js";

const app = express();
const server = createServer(app);

// The gateway is deployed behind Render's reverse proxy. Without this Express
// sees the proxy IP for every request, causing unrelated visitors to share one
// rate-limit bucket and receive 429 responses.
if (env.nodeEnv === "production") app.set("trust proxy", 1);

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(securityHeaders);
app.use(morgan("combined", { stream: { write: (message) => logger.info(message.trim()) } }));

app.get("/health", (_req, res) => {
  sendSuccess(res, { service: "api-gateway", status: "ok" });
});

// Authentication endpoints use the auth service's dedicated limiter. Keep
// them out of the tenant limiter, which otherwise groups anonymous visitors
// by IP and can block legitimate registrations behind shared networks.
app.use((req, res, next) => {
  if (req.path.startsWith("/api/v1/auth/")) return next();
  return tenantRateLimiter(req, res, next);
});

app.get("/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

app.get("/docs", (_req, res) => {
  res.type("html").send(openApiHtml);
});

registerGatewayRoutes(app);

app.use(notFoundHandler);
app.use(errorHandler);

initRealtime(server).catch((error) => logger.error({ message: "Socket.IO realtime init failed", error }));

server.listen(env.apiGatewayPort, () => {
  logger.info(`API gateway listening on port ${env.apiGatewayPort}`);
});
