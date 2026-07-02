import { Router } from "express";
import { authenticate, requirePermissions } from "../../../../shared/middlewares/auth.js";
import { validate } from "../../../../shared/middlewares/validate.js";
import { PERMISSIONS } from "../../../../shared/constants/permissions.js";
import { upsertSubscription } from "../controllers/subscription.controller.js";
import { upsertSubscriptionSchema } from "../schemas/subscription.schema.js";

export const subscriptionRouter = Router();

subscriptionRouter.use(authenticate);
subscriptionRouter.put(
  "/",
  requirePermissions(PERMISSIONS.MANAGE_SUBSCRIPTIONS),
  validate(upsertSubscriptionSchema),
  upsertSubscription,
);
