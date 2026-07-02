import { HttpError } from "./httpError.js";

export const getRequestedFoodQuantities = (items) => {
  const quantities = new Map();
  for (const item of items) {
    quantities.set(item.foodId, (quantities.get(item.foodId) || 0) + item.quantity);
  }
  return quantities;
};

export const assertInventoryAvailable = (foods, requestedQuantities) => {
  for (const food of foods) {
    if (!food.trackInventory) continue;
    const requested = requestedQuantities.get(food.id) || 0;
    const stock = food.stockQuantity ?? 0;
    if (stock < requested) {
      throw new HttpError(409, `${food.name} is out of stock`);
    }
  }
};

export const decrementInventory = async (tx, foods, requestedQuantities) => {
  const results = await Promise.all(
    foods
      .filter((food) => food.trackInventory)
      .map(async (food) => {
        const requested = requestedQuantities.get(food.id) || 0;
        const result = await tx.food.updateMany({
          where: {
            id: food.id,
            stockQuantity: { gte: requested },
          },
          data: {
            stockQuantity: { decrement: requested },
            isAvailable: (food.stockQuantity ?? 0) - requested > 0,
          },
        });
        return { food, result };
      }),
  );

  const failed = results.find(({ result }) => result.count !== 1);
  if (failed) {
    throw new HttpError(409, `${failed.food.name} is out of stock`);
  }
};

export const restoreInventoryForOrder = async (tx, orderId) => {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { food: true } } },
  });
  if (!order) return;

  await Promise.all(
    order.items
      .filter((item) => item.food?.trackInventory)
      .map((item) =>
        tx.food.update({
          where: { id: item.foodId },
          data: {
            stockQuantity: { increment: item.quantity },
            isAvailable: true,
          },
        }),
      ),
  );
};
