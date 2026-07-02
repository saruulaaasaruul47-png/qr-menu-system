import asyncHandler from "express-async-handler";
import { sendSuccess } from "../../../../shared/utils/response.js";
import { auditService } from "../../../../shared/services/audit.service.js";
import { subscriptionService } from "../services/subscription.service.js";

export const upsertSubscription = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.upsert(req.validated.body);
  await auditService.record({
    req,
    action: "SUBSCRIPTION_UPDATED",
    entity: "Subscription",
    entityId: subscription.id,
    newValue: subscription,
    restaurantId: subscription.restaurantId,
  });
  sendSuccess(res, subscription);
});
