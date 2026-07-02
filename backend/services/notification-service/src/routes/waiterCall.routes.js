import { Router } from "express";
import { validate } from "../../../../shared/middlewares/validate.js";
import { createWaiterCall } from "../controllers/notification.controller.js";
import { waiterCallSchema } from "../schemas/notification.schema.js";

export const waiterCallRouter = Router();

waiterCallRouter.post("/", validate(waiterCallSchema), createWaiterCall);
