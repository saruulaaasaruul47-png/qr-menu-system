import { Router } from "express";
import { authenticate, requirePermissions } from "../../../../shared/middlewares/auth.js";
import { validate } from "../../../../shared/middlewares/validate.js";
import { PERMISSIONS } from "../../../../shared/constants/permissions.js";
import { createQr, createTableQr, listQrScans, scanQr } from "../controllers/qr.controller.js";
import { createQrSchema, listQrScansSchema, scanQrSchema, tableQrSchema } from "../schemas/qr.schema.js";

export const qrRouter = Router();

qrRouter.post("/", authenticate, requirePermissions(PERMISSIONS.MANAGE_TABLES), validate(createQrSchema), createQr);
qrRouter.get("/table/:tableId", authenticate, requirePermissions(PERMISSIONS.MANAGE_TABLES), validate(tableQrSchema), createTableQr);
qrRouter.get("/scans", authenticate, validate(listQrScansSchema), listQrScans);
qrRouter.get("/:id/scan", validate(scanQrSchema), scanQr);
