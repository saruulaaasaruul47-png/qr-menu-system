import { prisma } from "../../../../shared/config/prisma.js";
import { HttpError } from "../../../../shared/utils/httpError.js";
import { publishEvent } from "../../../../shared/utils/eventBus.js";
import { EVENTS } from "../../../../shared/constants/events.js";
import { ROLES } from "../../../../shared/constants/permissions.js";
import { ensureTenantAccess, resolveRestaurantId } from "../../../../shared/utils/tenant.js";

const pointsFromAmount = (amount) => Math.floor(amount / 1000);

const LOYALTY_DISCOUNT_THRESHOLD = 5;
const LOYALTY_DISCOUNT_RATE = 0.1;

export const loyaltyService = {
  async publicLookup({ restaurantId, phone }) {
    if (!restaurantId || !phone) throw new HttpError(400, "restaurantId and phone are required");

    const record = await prisma.loyalty.findFirst({
      where: { restaurantId, phone },
    });

    const visitCount = record?.visitCount || 0;
    return {
      visitCount,
      points: record?.points || 0,
      eligibleForDiscount: visitCount >= LOYALTY_DISCOUNT_THRESHOLD,
      discountRate: visitCount >= LOYALTY_DISCOUNT_THRESHOLD ? LOYALTY_DISCOUNT_RATE : 0,
      visitsUntilReward: Math.max(0, LOYALTY_DISCOUNT_THRESHOLD - visitCount),
    };
  },

  async recordVisit(payload) {
    if (!payload.phone) {
      return { message: "Phone not provided. Visit not recorded.", visitCount: 0 };
    }

    const points = pointsFromAmount(payload.amount);
    const eventId = payload.paymentId ? `loyalty:${payload.paymentId}` : null;

    const loyalty = await prisma.$transaction(async (tx) => {
      if (eventId) {
        const processed = await tx.processedEvent.findUnique({ where: { id: eventId } });
        if (processed) throw new HttpError(409, "Loyalty visit already recorded for this payment");
      }

      const existing = await tx.loyalty.findFirst({
        where: { restaurantId: payload.restaurantId, phone: payload.phone },
      });

      const updated = existing
        ? await tx.loyalty.update({
            where: { id: existing.id },
            data: {
              points: { increment: points },
              visitCount: { increment: 1 },
            },
          })
        : await tx.loyalty.create({
            data: {
              restaurantId: payload.restaurantId,
              phone: payload.phone,
              points,
              visitCount: 1,
            },
          });

      if (eventId) {
        await tx.processedEvent.create({ data: { id: eventId, type: EVENTS.LOYALTY_POINTS_ADDED } });
      }

      return updated;
    });

    await publishEvent(EVENTS.LOYALTY_POINTS_ADDED, {
      restaurantId: payload.restaurantId,
      phone: payload.phone,
      pointsAdded: points,
      visitCount: loyalty.visitCount,
      paymentId: payload.paymentId,
    });

    return { loyalty, pointsAdded: points, visitCount: loyalty.visitCount };
  },

  async addPoints(payload) {
    return this.recordVisit(payload);
  },

  async lookup(user, query = {}) {
    const restaurantId = resolveRestaurantId(user, query.restaurantId);
    if (!restaurantId) throw new HttpError(400, "restaurantId is required");
    ensureTenantAccess(user, restaurantId);

    return prisma.loyalty.findMany({
      where: { restaurantId, phone: query.phone },
      orderBy: { updatedAt: "desc" },
    });
  },

  async deletePersonalData(user, payload) {
    const restaurantId = resolveRestaurantId(user, payload.restaurantId);
    if (!restaurantId) throw new HttpError(400, "restaurantId is required");
    ensureTenantAccess(user, restaurantId);

    const result = await prisma.loyalty.deleteMany({
      where: { restaurantId, phone: payload.phone },
    });

    return { message: "Loyalty personal data deleted", deletedCount: result.count };
  },
};
