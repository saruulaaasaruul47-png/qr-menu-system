import { prisma } from "../../../../shared/config/prisma.js";
import { PAYMENT_STATUS } from "../../../../shared/constants/domain.js";
import { HttpError } from "../../../../shared/utils/httpError.js";
import { ROLES } from "../../../../shared/constants/permissions.js";
import { ensureTenantAccess, resolveRestaurantId, scopedRestaurantWhere } from "../../../../shared/utils/tenant.js";

export const analyticsService = {
  async ingest(payload) {
    return prisma.analyticsEvent.create({
      data: {
        restaurantId: payload.restaurantId,
        type: payload.type,
        payload: payload.payload,
      },
    });
  },

  async metrics(user, query = {}) {
    const restaurantId = resolveRestaurantId(user, query.restaurantId);
    if (!restaurantId && user.role !== ROLES.SUPER_ADMIN) throw new HttpError(400, "restaurantId is required");
    if (restaurantId) ensureTenantAccess(user, restaurantId);

    const scopedWhere = scopedRestaurantWhere(restaurantId);
    const orderItemWhere = restaurantId ? { order: { restaurantId } } : {};

    const [
      restaurantCount,
      totalOrders,
      completedOrders,
      cancelledOrders,
      totalScans,
      todayScans,
      revenue,
      eventCounts,
      popularFoodRows,
    ] = await Promise.all([
      user.role === ROLES.SUPER_ADMIN && !restaurantId ? prisma.restaurant.count() : Promise.resolve(restaurantId ? 1 : 0),
      prisma.order.count({ where: scopedWhere }),
      prisma.order.count({ where: { ...scopedWhere, status: "COMPLETED" } }),
      prisma.order.count({ where: { ...scopedWhere, status: "CANCELLED" } }),
      prisma.qrScan.count({ where: scopedWhere }),
      prisma.qrScan.count({ where: { ...scopedWhere, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      prisma.payment.aggregate({ where: { ...scopedWhere, status: PAYMENT_STATUS.SUCCESS }, _sum: { amount: true } }),
      prisma.analyticsEvent.groupBy({
        by: ["type"],
        where: scopedWhere,
        _count: { type: true },
      }),
      prisma.orderItem.groupBy({
        by: ["foodId"],
        where: orderItemWhere,
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

    const foodIds = popularFoodRows.map((row) => row.foodId);
    const foods = foodIds.length
      ? await prisma.food.findMany({ where: { id: { in: foodIds } }, select: { id: true, name: true, price: true } })
      : [];
    const foodMap = new Map(foods.map((food) => [food.id, food]));
    const popularFoods = popularFoodRows.map((row) => ({
      ...row,
      food: foodMap.get(row.foodId) || null,
      quantity: row._sum.quantity || 0,
      revenue: (foodMap.get(row.foodId)?.price || 0) * (row._sum.quantity || 0),
    }));

    return {
      restaurantCount,
      totalOrders,
      completedOrders,
      cancelledOrders,
      revenue: revenue._sum.amount || 0,
      qr: { totalScans, todayScans },
      eventCounts: eventCounts.map((event) => ({ type: event.type, count: event._count.type })),
      popularFoods,
    };
  },
};
