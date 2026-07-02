import { createProxyMiddleware } from "http-proxy-middleware";
import { logger } from "../../../../shared/utils/logger.js";
import { sendError } from "../../../../shared/utils/response.js";
import { createRoundRobin } from "./loadBalancer.js";

export const proxy = (routePath, targets, rewriteTo = "") => {
  const targetList = Array.isArray(targets) ? targets : [targets];
  const nextTarget = createRoundRobin(targetList);

  return createProxyMiddleware({
    target: targetList[0],
    changeOrigin: true,
    router: () => nextTarget(),
    pathRewrite: (_path, req) => req.originalUrl.replace(routePath, rewriteTo),
    on: {
      error: (error, _req, res) => {
        logger.error(error);
        sendError(res, { statusCode: 502, message: "Service is unavailable", error: "BAD_GATEWAY" });
      },
    },
  });
};
