import { Router } from "express";
import { authenticate, requirePermissions } from "../../../../shared/middlewares/auth.js";
import { validate } from "../../../../shared/middlewares/validate.js";
import { PERMISSIONS } from "../../../../shared/constants/permissions.js";
import { listEventOutbox, retryEvent } from "../controllers/eventOutbox.controller.js";
import { eventOutboxIdSchema, eventOutboxQuerySchema } from "../schemas/eventOutbox.schema.js";

export const eventOutboxRouter = Router();

eventOutboxRouter.use(authenticate, requirePermissions(PERMISSIONS.VIEW_REPORTS));
eventOutboxRouter.get("/", validate(eventOutboxQuerySchema), listEventOutbox);
eventOutboxRouter.post("/:id/retry", validate(eventOutboxIdSchema), retryEvent);
