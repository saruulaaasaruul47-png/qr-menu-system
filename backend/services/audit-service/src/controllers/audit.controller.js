import asyncHandler from "express-async-handler";
import { sendSuccess } from "../../../../shared/utils/response.js";
import { auditLogService } from "../services/auditLog.service.js";

export const listAuditLogs = asyncHandler(async (req, res) => {
  sendSuccess(res, await auditLogService.list(req.user, req.validated.query));
});
