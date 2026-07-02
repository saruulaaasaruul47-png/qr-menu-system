import { Router } from "express";
import { authenticate } from "../../../../shared/middlewares/auth.js";
import { validate } from "../../../../shared/middlewares/validate.js";
import { emptyRequestSchema } from "../../../../shared/schemas/request.schema.js";
import { createNotification, listNotifications, markNotificationRead } from "../controllers/notification.controller.js";
import { createNotificationSchema, notificationIdSchema } from "../schemas/notification.schema.js";

export const notificationRouter = Router();

notificationRouter.use(authenticate);
notificationRouter.get("/", validate(emptyRequestSchema), listNotifications);
notificationRouter.post("/", validate(createNotificationSchema), createNotification);
notificationRouter.patch("/:id/read", validate(notificationIdSchema), markNotificationRead);
