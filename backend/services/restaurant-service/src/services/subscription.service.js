import { prisma } from "../../../../shared/config/prisma.js";
import { cache } from "../../../../shared/utils/cache.js";

const PLAN_LIMITS = Object.freeze({
  FREE: 10,
  STANDARD: 200,
  PREMIUM: 999999,
});

export const subscriptionService = {
  async upsert(payload) {
    const foodLimit = PLAN_LIMITS[payload.plan] || payload.foodLimit;
    const subscription = await prisma.subscription.upsert({
      where: { restaurantId: payload.restaurantId },
      create: {
        restaurantId: payload.restaurantId,
        plan: payload.plan,
        foodLimit,
        isActive: payload.isActive ?? true,
        expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : undefined,
      },
      update: {
        plan: payload.plan,
        foodLimit,
        isActive: payload.isActive,
        expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : undefined,
      },
    });

    cache.del(`restaurant:${payload.restaurantId}`);
    cache.clearByPrefix("restaurants:list:");
    return subscription;
  },
};
