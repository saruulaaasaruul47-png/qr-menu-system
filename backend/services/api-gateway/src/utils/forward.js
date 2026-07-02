import { logger } from "../../../../shared/utils/logger.js";
import { sendError } from "../../../../shared/utils/response.js";
import { createRoundRobin } from "./loadBalancer.js";

const hopByHopHeaders = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const forwardedHeaders = (headers) => {
  const next = {};
  Object.entries(headers).forEach(([key, value]) => {
    if (!hopByHopHeaders.has(key.toLowerCase()) && value !== undefined) {
      next[key] = Array.isArray(value) ? value.join(",") : value;
    }
  });
  return next;
};

export const forwardJson = (routePath, targets, rewriteTo = "") => {
  const targetList = Array.isArray(targets) ? targets : [targets];
  const nextTarget = createRoundRobin(targetList);

  return async (req, res) => {
    const target = nextTarget();
    const upstreamPath = req.originalUrl.replace(routePath, rewriteTo);
    const url = new URL(upstreamPath, target);
    const headers = forwardedHeaders(req.headers);
    const hasBody = !["GET", "HEAD"].includes(req.method.toUpperCase()) && req.body !== undefined;

    try {
      const response = await fetch(url, {
        method: req.method,
        headers,
        body: hasBody ? JSON.stringify(req.body) : undefined,
      });
      const text = await response.text();

      res.status(response.status);
      response.headers.forEach((value, key) => {
        if (!hopByHopHeaders.has(key.toLowerCase())) res.setHeader(key, value);
      });

      if (!text) return res.end();
      return res.type(response.headers.get("content-type") || "application/json").send(text);
    } catch (error) {
      logger.error({ message: "Gateway forward failed", target, upstreamPath, error });
      return sendError(res, { statusCode: 502, message: "Service is unavailable", error: "BAD_GATEWAY" });
    }
  };
};
