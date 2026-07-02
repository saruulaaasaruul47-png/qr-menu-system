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

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(securityHeaders);
app.use(morgan("combined", { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(tenantRateLimiter);

app.get("/health", (_req, res) => {
  sendSuccess(res, { service: "api-gateway", status: "ok" });
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
