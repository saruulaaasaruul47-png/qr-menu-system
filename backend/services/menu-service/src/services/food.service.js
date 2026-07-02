import { prisma } from "../../../../shared/config/prisma.js";
import { cache } from "../../../../shared/utils/cache.js";
import { HttpError } from "../../../../shared/utils/httpError.js";
import { storageService } from "../../../../shared/services/storage.service.js";
import { subscriptionPolicyService } from "../../../../shared/services/subscriptionPolicy.service.js";
import { ensureTenantAccess, resolveRestaurantId } from "../../../../shared/utils/tenant.js";

const foodWhere = (query) => ({
  restaurantId: query.restaurantId,
  categoryId: query.categoryId,
  isAvailable: query.availableOnly ? true : undefined,
  isVegetarian: query.vegetarian ? true : undefined,
  isVegan: query.vegan ? true : undefined,
  isHalal: query.halal ? true : undefined,
  isSpicy: query.spicy ? true : undefined,
  isGlutenFree: query.glutenFree ? true : undefined,
  isNutFree: query.nutFree ? true : undefined,
  price: {
    gte: query.minPrice,
    lte: query.maxPrice,
  },
  OR: query.search
    ? [
        { name: { contains: query.search } },
        { description: { contains: query.search } },
      ]
    : undefined,
});

const normalizeFoodPayload = (payload) =>
  Object.fromEntries(
    Object.entries({
      categoryId: payload.categoryId,
      name: payload.name,
      nameI18n: payload.nameI18n,
      description: payload.description,
      descriptionI18n: payload.descriptionI18n,
      price: payload.price,
      discountPrice: payload.discountPrice,
      imageUrl: payload.imageUrl,
      ingredients: payload.ingredients,
      allergens: payload.allergens,
      isAvailable: payload.isAvailable,
      trackInventory: payload.trackInventory,
      stockQuantity: payload.stockQuantity,
      isVegetarian: payload.isVegetarian,
      isVegan: payload.isVegan,
      isHalal: payload.isHalal,
      isSpicy: payload.isSpicy,
      isGlutenFree: payload.isGlutenFree,
      isNutFree: payload.isNutFree,
      preparationTime: payload.preparationTime,
    }).filter(([, value]) => value !== undefined),
  );

const localizeFood = (food, lang) => {
  if (!lang) return food;
  return {
    ...food,
    displayName: food.nameI18n?.[lang] || food.name,
    displayDescription: food.descriptionI18n?.[lang] || food.description,
  };
};

export const foodService = {
  async publicList(query) {
    const cacheKey = `foods:public:${JSON.stringify(query)}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const foods = await prisma.food.findMany({
      where: foodWhere(query),
      include: {
        category: true,
        modifierGroups: {
          include: {
            options: { where: { isAvailable: true }, orderBy: { createdAt: "asc" } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const localizedFoods = foods.map((food) => localizeFood(food, query.lang));
    cache.set(cacheKey, localizedFoods, 30_000);
    return localizedFoods;
  },

  async create(user, payload) {
    const restaurantId = resolveRestaurantId(user, payload.restaurantId);
    if (!restaurantId) throw new HttpError(400, "restaurantId is required");
    ensureTenantAccess(user, restaurantId);
    await subscriptionPolicyService.assertFoodLimit(restaurantId);

    const food = await prisma.food.create({
      data: { restaurantId, ...normalizeFoodPayload(payload) },
    });

    cache.clearByPrefix("foods:public:");
    return food;
  },

  async update(user, foodId, payload) {
    const food = await prisma.food.findUnique({ where: { id: foodId } });
    if (!food) throw new HttpError(404, "Food not found");
    ensureTenantAccess(user, food.restaurantId);
    await subscriptionPolicyService.assertMenuWritable(food.restaurantId);

    const updated = await prisma.food.update({
      where: { id: foodId },
      data: normalizeFoodPayload(payload),
    });

    cache.clearByPrefix("foods:public:");
    return updated;
  },

  async remove(user, foodId) {
    const food = await prisma.food.findUnique({ where: { id: foodId } });
    if (!food) throw new HttpError(404, "Food not found");
    ensureTenantAccess(user, food.restaurantId);
    await subscriptionPolicyService.assertMenuWritable(food.restaurantId);

    await prisma.food.delete({ where: { id: foodId } });
    cache.clearByPrefix("foods:public:");
    return { message: "Food deleted successfully" };
  },

  async attachImage(user, foodId, file) {
    if (!file) throw new HttpError(400, "Image file is required");

    const food = await prisma.food.findUnique({ where: { id: foodId } });
    if (!food) throw new HttpError(404, "Food not found");
    ensureTenantAccess(user, food.restaurantId);
    await subscriptionPolicyService.assertMenuWritable(food.restaurantId);

    const uploaded = await storageService.uploadBuffer({
      restaurantId: food.restaurantId,
      folder: `foods/${foodId}`,
      file,
    });
    const updated = await prisma.food.update({ where: { id: foodId }, data: { imageUrl: uploaded.url } });
    cache.clearByPrefix("foods:public:");

    return { food: updated, file: uploaded };
  },
};
