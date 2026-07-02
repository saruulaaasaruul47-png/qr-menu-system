import { prisma } from "../../../../shared/config/prisma.js";
import { cache } from "../../../../shared/utils/cache.js";
import { HttpError } from "../../../../shared/utils/httpError.js";
import { ensureTenantAccess } from "../../../../shared/utils/tenant.js";

const getFoodForUser = async (user, foodId) => {
  const food = await prisma.food.findUnique({ where: { id: foodId } });
  if (!food) throw new HttpError(404, "Food not found");
  ensureTenantAccess(user, food.restaurantId);
  return food;
};

const getGroupForUser = async (user, groupId) => {
  const group = await prisma.foodModifierGroup.findUnique({ where: { id: groupId } });
  if (!group) throw new HttpError(404, "Modifier group not found");
  ensureTenantAccess(user, group.restaurantId);
  return group;
};

const getOptionForUser = async (user, optionId) => {
  const option = await prisma.foodModifierOption.findUnique({ where: { id: optionId } });
  if (!option) throw new HttpError(404, "Modifier option not found");
  ensureTenantAccess(user, option.restaurantId);
  return option;
};

export const modifierService = {
  async list(user, foodId) {
    const food = await getFoodForUser(user, foodId);
    return prisma.foodModifierGroup.findMany({
      where: { foodId: food.id },
      include: { options: true },
      orderBy: { createdAt: "asc" },
    });
  },

  async createGroup(user, foodId, payload) {
    const food = await getFoodForUser(user, foodId);
    const group = await prisma.foodModifierGroup.create({
      data: {
        restaurantId: food.restaurantId,
        foodId: food.id,
        name: payload.name,
        isRequired: payload.isRequired,
        minSelect: payload.minSelect,
        maxSelect: payload.maxSelect,
        options: payload.options?.length
          ? {
              create: payload.options.map((option) => ({
                restaurantId: food.restaurantId,
                foodId: food.id,
                name: option.name,
                priceDelta: option.priceDelta ?? 0,
                isAvailable: option.isAvailable ?? true,
              })),
            }
          : undefined,
      },
      include: { options: true },
    });
    cache.clearByPrefix("foods:public:");
    return group;
  },

  async updateGroup(user, groupId, payload) {
    await getGroupForUser(user, groupId);
    const group = await prisma.foodModifierGroup.update({
      where: { id: groupId },
      data: payload,
      include: { options: true },
    });
    cache.clearByPrefix("foods:public:");
    return group;
  },

  async deleteGroup(user, groupId) {
    await getGroupForUser(user, groupId);
    await prisma.foodModifierGroup.delete({ where: { id: groupId } });
    cache.clearByPrefix("foods:public:");
    return { message: "Modifier group deleted successfully" };
  },

  async createOption(user, groupId, payload) {
    const group = await getGroupForUser(user, groupId);
    const option = await prisma.foodModifierOption.create({
      data: {
        restaurantId: group.restaurantId,
        foodId: group.foodId,
        groupId: group.id,
        name: payload.name,
        priceDelta: payload.priceDelta ?? 0,
        isAvailable: payload.isAvailable ?? true,
      },
    });
    cache.clearByPrefix("foods:public:");
    return option;
  },

  async updateOption(user, optionId, payload) {
    await getOptionForUser(user, optionId);
    const option = await prisma.foodModifierOption.update({ where: { id: optionId }, data: payload });
    cache.clearByPrefix("foods:public:");
    return option;
  },

  async deleteOption(user, optionId) {
    await getOptionForUser(user, optionId);
    await prisma.foodModifierOption.delete({ where: { id: optionId } });
    cache.clearByPrefix("foods:public:");
    return { message: "Modifier option deleted successfully" };
  },
};
