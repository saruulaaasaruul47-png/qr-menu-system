import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { publishEvent } from "../utils/eventBus.js";
import { EVENTS } from "../constants/events.js";

export const subscriptionPolicyService = {
  async assertMenuWritable(restaurantId) {
    const subscription = await prisma.subscription.findUnique({ where: { restaurantId } });
    if (!subscription || !subscription.isActive) {
      throw new HttpError(403, "Subscription is inactive. Menu is read-only.");
    }

    if (subscription.expiresAt && subscription.expiresAt <= new Date()) {
      await publishEvent(EVENTS.SUBSCRIPTION_EXPIRED, { restaurantId, subscriptionId: subscription.id });
      throw new HttpError(403, "Subscription expired. Menu is read-only.");
    }

    return subscription;
  },

  async assertFoodLimit(restaurantId) {
    const subscription = await this.assertMenuWritable(restaurantId);
    const foodCount = await prisma.food.count({ where: { restaurantId } });

    if (foodCount >= subscription.foodLimit) {
      throw new HttpError(403, `Food limit exceeded for ${subscription.plan} plan`);
    }

    return subscription;
  },
};
