import { logger } from "../utils/logger.js";
import { sendError } from "../utils/response.js";

export const notFoundHandler = (req, _res, next) => {
  next({ statusCode: 404, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

export const errorHandler = (error, _req, res, _next) => {
  const isDatabaseConnectionError = error.code === "ECONNREFUSED";
  const statusCode = error.statusCode || (isDatabaseConnectionError ? 503 : 500);
  const message = isDatabaseConnectionError
    ? "Database is unavailable. Start PostgreSQL and verify DATABASE_URL."
    : error.message || "Internal server error";

  if (statusCode >= 500) {
    logger.error(error);
  }

  sendError(res, {
    statusCode,
    message,
    error: error.details || error.code || message,
    details: error.details,
  });
};
