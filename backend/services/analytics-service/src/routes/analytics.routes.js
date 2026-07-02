import { Router } from "express";
import { authenticate, requirePermissions } from "../../../../shared/middlewares/auth.js";
import { validate } from "../../../../shared/middlewares/validate.js";
import { PERMISSIONS } from "../../../../shared/constants/permissions.js";
import { getMetrics, ingestEvent } from "../controllers/analytics.controller.js";
import { ingestEventSchema, metricsQuerySchema } from "../schemas/analytics.schema.js";

export const analyticsRouter = Router();

analyticsRouter.post("/events", validate(ingestEventSchema), ingestEvent);
analyticsRouter.get(
  "/metrics",
  authenticate,
  requirePermissions(PERMISSIONS.VIEW_REPORTS),
  validate(metricsQuerySchema),
  getMetrics,
);
