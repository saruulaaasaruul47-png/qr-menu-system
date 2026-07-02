import { prisma } from "../../../../shared/config/prisma.js";
import { cache } from "../../../../shared/utils/cache.js";
import { HttpError } from "../../../../shared/utils/httpError.js";
import { ensureTenantAccess, resolveRestaurantId } from "../../../../shared/utils/tenant.js";

export const categoryService = {
  async publicList(restaurantId) {
    const cacheKey = `categories:public:${restaurantId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const categories = await prisma.category.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
    });

    cache.set(cacheKey, categories, 60_000);
    return categories;
  },

  async create(user, payload) {
    const restaurantId = resolveRestaurantId(user, payload.restaurantId);
    if (!restaurantId) throw new HttpError(400, "restaurantId is required");
    ensureTenantAccess(user, restaurantId);

    const category = await prisma.category.create({
      data: { restaurantId, name: payload.name, description: payload.description },
    });

    cache.del(`categories:public:${restaurantId}`);
    return category;
  },

  async update(user, categoryId, payload) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new HttpError(404, "Category not found");
    ensureTenantAccess(user, category.restaurantId);

    const updated = await prisma.category.update({ where: { id: categoryId }, data: payload });
    cache.del(`categories:public:${category.restaurantId}`);
    return updated;
  },

  async remove(user, categoryId) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new HttpError(404, "Category not found");
    ensureTenantAccess(user, category.restaurantId);

    await prisma.category.delete({ where: { id: categoryId } });
    cache.del(`categories:public:${category.restaurantId}`);
    return { message: "Category deleted successfully" };
  },
};
