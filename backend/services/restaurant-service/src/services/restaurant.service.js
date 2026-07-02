import { prisma } from "../../../../shared/config/prisma.js";
import { cache } from "../../../../shared/utils/cache.js";
import { HttpError } from "../../../../shared/utils/httpError.js";
import { ROLES } from "../../../../shared/constants/permissions.js";
import { ensureTenantAccess } from "../../../../shared/utils/tenant.js";

export const restaurantService = {
  async publicProfile(restaurantId) {
    const cacheKey = `restaurant:public:${restaurantId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        bannerUrl: true,
        faviconUrl: true,
        themeColor: true,
        font: true,
        qrDesign: true,
        isActive: true,
      },
    });
    if (!restaurant || !restaurant.isActive) throw new HttpError(404, "Restaurant not found");

    cache.set(cacheKey, restaurant, 60_000);
    return restaurant;
  },

  async list(user) {
    const cacheKey = `restaurants:list:${user.role}:${user.restaurantId || "all"}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const where = user.role === ROLES.SUPER_ADMIN ? {} : { id: user.restaurantId };
    const restaurants = await prisma.restaurant.findMany({
      where,
      include: { subscription: true },
      orderBy: { createdAt: "desc" },
    });

    cache.set(cacheKey, restaurants, 60_000);
    return restaurants;
  },

  async get(user, restaurantId) {
    ensureTenantAccess(user, restaurantId);
    const cacheKey = `restaurant:${restaurantId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { subscription: true },
    });
    if (!restaurant) throw new HttpError(404, "Restaurant not found");

    cache.set(cacheKey, restaurant, 60_000);
    return restaurant;
  },

  async create(payload) {
    const restaurant = await prisma.restaurant.create({
      data: {
        ...payload,
        subscription: {
          create: {
            plan: "FREE",
            foodLimit: 10,
            isActive: true,
          },
        },
      },
      include: { subscription: true },
    });
    cache.clearByPrefix("restaurants:list:");
    return restaurant;
  },

  async update(user, restaurantId, payload) {
    if (user.role === ROLES.SUPER_ADMIN) {
      throw new HttpError(403, "Super admin can create and delete restaurants, but cannot edit them");
    }
    ensureTenantAccess(user, restaurantId);
    const restaurant = await prisma.restaurant.update({ where: { id: restaurantId }, data: payload });
    cache.del(`restaurant:${restaurantId}`);
    cache.del(`restaurant:public:${restaurantId}`);
    cache.clearByPrefix("restaurants:list:");
    return restaurant;
  },

  async remove(user, restaurantId) {
    if (user.role !== ROLES.SUPER_ADMIN) {
      throw new HttpError(403, "Only super admin can delete restaurants");
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { subscription: true },
    });
    if (!restaurant) throw new HttpError(404, "Restaurant not found");

    await prisma.restaurant.delete({ where: { id: restaurantId } });
    cache.del(`restaurant:${restaurantId}`);
    cache.del(`restaurant:public:${restaurantId}`);
    cache.clearByPrefix("restaurants:list:");
    return restaurant;
  },
};
