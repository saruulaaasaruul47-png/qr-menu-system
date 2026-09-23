import express from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "../config/env.js";
import { errorHandler, notFoundHandler } from "../middlewares/errorHandler.js";
import { securityHeaders } from "../middlewares/security.js";
import { logger } from "../utils/logger.js";
import { sendSuccess } from "../utils/response.js";

export const createServiceApp = ({
  serviceName,
  rateLimiter,
  preJsonRoutes = [],
  routes = [],
  jsonLimit = "1mb",
  useUrlencoded = true,
}) => {
  const app = express();

  // Render terminates TLS at its reverse proxy. Trust exactly that one hop in
  // production so req.ip is the visitor's address, not Render's proxy address.
  // This keeps rate-limit buckets separate for different visitors.
  if (env.nodeEnv === "production") app.set("trust proxy", 1);

  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(securityHeaders);

  preJsonRoutes.forEach(({ method = "use", path, handlers }) => {
    app[method](path, ...handlers);
  });

  app.use(express.json({ limit: jsonLimit }));
  if (useUrlencoded) app.use(express.urlencoded({ extended: true }));
  app.use(morgan("combined", { stream: { write: (message) => logger.info(message.trim()) } }));

  app.get("/health", (_req, res) => {
    sendSuccess(res, { service: serviceName, status: "ok" });
  });

  if (rateLimiter) app.use(rateLimiter);

  routes.forEach(({ path, handlers }) => {
    app.use(path, ...handlers);
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const listenService = (app, { port, displayName }) => {
  app.listen(port, () => {
    logger.info(`${displayName} listening on port ${port}`);
  });
};
