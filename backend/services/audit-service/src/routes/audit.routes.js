import { Router } from "express";
import { authenticate, requirePermissions } from "../../../../shared/middlewares/auth.js";
import { validate } from "../../../../shared/middlewares/validate.js";
import { PERMISSIONS } from "../../../../shared/constants/permissions.js";
import { listAuditLogs } from "../controllers/audit.controller.js";
import { auditQuerySchema } from "../schemas/audit.schema.js";

export const auditRouter = Router();

auditRouter.get("/", authenticate, requirePermissions(PERMISSIONS.VIEW_REPORTS), validate(auditQuerySchema), listAuditLogs);
