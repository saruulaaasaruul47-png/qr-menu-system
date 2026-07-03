import { prisma } from "../../../../shared/config/prisma.js";
import { ORDER_SOURCE, ORDER_STATUS, PAYMENT_STATUS, TABLE_STATUS } from "../../../../shared/constants/domain.js";
import { HttpError } from "../../../../shared/utils/httpError.js";
import { publishEvent } from "../../../../shared/utils/eventBus.js";
import { EVENTS } from "../../../../shared/constants/events.js";
import { ROLES } from "../../../../shared/constants/permissions.js";
import { assertInventoryAvailable, decrementInventory, getRequestedFoodQuantities, restoreInventoryForOrder } from "../../../../shared/utils/inventory.js";
import { ensureTenantAccess, resolveRestaurantId } from "../../../../shared/utils/tenant.js";
import { assertCouponUsable, calculateDiscount, normalizeCouponCode } from "./coupon.service.js";

const statusOwners = {
  [ORDER_STATUS.ACCEPTED]: ["KITCHEN", "WAITER", "MANAGER", "OWNER", "SUPER_ADMIN"],
  [ORDER_STATUS.PREPARING]: ["KITCHEN", "MANAGER", "OWNER", "SUPER_ADMIN"],
  [ORDER_STATUS.READY]: ["KITCHEN", "MANAGER", "OWNER", "SUPER_ADMIN"],
  [ORDER_STATUS.SERVED]: ["WAITER", "MANAGER", "OWNER", "SUPER_ADMIN"],
  [ORDER_STATUS.COMPLETED]: ["CASHIER", "MANAGER", "OWNER", "SUPER_ADMIN"],
  [ORDER_STATUS.CANCELLED]: ["WAITER", "MANAGER", "OWNER", "SUPER_ADMIN"],
};

const ensureStatusOwner = (user, status) => {
  if (!statusOwners[status]?.includes(user.role)) {
    throw new HttpError(403, `${user.role} cannot change order status to ${status}`);
  }
};

export const orderService = {
  async createGuestOrder(payload) {
    if (payload.tableId) {
      const table = await prisma.table.findUnique({ where: { id: payload.tableId } });
      if (!table || table.restaurantId !== payload.restaurantId || !table.isActive) {
        throw new HttpError(400, "Invalid table for this restaurant");
      }
    }

    const foods = await prisma.food.findMany({
      where: {
        restaurantId: payload.restaurantId,
        id: { in: payload.items.map((item) => item.foodId) },
        isAvailable: true,
      },
    });

    if (foods.length !== payload.items.length) {
      throw new HttpError(400, "Some foods are unavailable or invalid");
    }

    const requestedQuantities = getRequestedFoodQuantities(payload.items);
    assertInventoryAvailable(foods, requestedQuantities);

    const optionIds = payload.items.flatMap((item) => item.modifierOptionIds || []);
    const options = optionIds.length
      ? await prisma.foodModifierOption.findMany({
          where: {
            restaurantId: payload.restaurantId,
            id: { in: optionIds },
            isAvailable: true,
          },
          include: { group: true },
        })
      : [];

    if (options.length !== new Set(optionIds).size) {
      throw new HttpError(400, "Some food modifier options are unavailable or invalid");
    }

    const foodMap = new Map(foods.map((food) => [food.id, food]));
    const optionMap = new Map(options.map((option) => [option.id, option]));
    const items = payload.items.map((item) => {
      const food = foodMap.get(item.foodId);
      const selectedOptions = (item.modifierOptionIds || []).map((id) => optionMap.get(id));
      if (selectedOptions.some((option) => option.foodId !== item.foodId)) {
        throw new HttpError(400, "Modifier option does not belong to selected food");
      }
      const modifiersTotal = selectedOptions.reduce((sum, option) => sum + option.priceDelta, 0);
      const price = (food.discountPrice ?? food.price) + modifiersTotal;
      const modifiers = selectedOptions.map((option) => ({
        optionId: option.id,
        groupId: option.groupId,
        groupName: option.group.name,
        name: option.name,
        priceDelta: option.priceDelta,
      }));

      return { foodId: item.foodId, quantity: item.quantity, price, modifiers };
    });
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let coupon = null;
    let discountAmount = 0;
    const couponCode = payload.couponCode ? normalizeCouponCode(payload.couponCode) : null;

    if (couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: { restaurantId_code: { restaurantId: payload.restaurantId, code: couponCode } },
      });
      assertCouponUsable(coupon, subtotal);
      discountAmount = calculateDiscount(coupon, subtotal);
    }

    const totalAmount = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          restaurantId: payload.restaurantId,
          tableId: payload.tableId,
          guestSessionId: payload.guestSessionId,
          source: payload.source || ORDER_SOURCE.QR,
          note: payload.note,
          customerPhone: payload.customerPhone || undefined,
          totalAmount,
          discountAmount,
          couponCode,
          items: {
            create: items.map((item) => ({
              foodId: item.foodId,
              quantity: item.quantity,
              price: item.price,
              modifiers: item.modifiers,
            })),
          },
        },
        include: { items: true },
      });

      if (payload.tableId) {
        await tx.table.update({ where: { id: payload.tableId }, data: { status: TABLE_STATUS.OCCUPIED } });
      }

      await decrementInventory(tx, foods, requestedQuantities);

      if (coupon) {
        const redeemed = await tx.coupon.updateMany({
          where: {
            id: coupon.id,
            OR: [{ usageLimit: null }, { usedCount: { lt: coupon.usageLimit } }],
          },
          data: { usedCount: { increment: 1 } },
        });
        if (redeemed.count !== 1) throw new HttpError(400, "Coupon usage limit reached");
        await tx.couponRedemption.create({
          data: {
            restaurantId: payload.restaurantId,
            couponId: coupon.id,
            orderId: created.id,
            code: coupon.code,
            discountAmount,
          },
        });
      }

      if (payload.payment) {
        await tx.payment.create({
          data: {
            orderId: created.id,
            restaurantId: payload.restaurantId,
            provider: payload.payment.provider,
            amount: totalAmount,
            status: PAYMENT_STATUS.SUCCESS,
            transactionId: payload.payment.transactionId,
            invoiceNo: `INV-${Date.now()}`,
            providerRef: `${payload.source || ORDER_SOURCE.QR}:${payload.payment.provider}`,
            invoiceUrl: `/invoices/${created.id}.pdf`,
          },
        });
      }

      await Promise.all(
        created.items.flatMap((orderItem, index) =>
          items[index].modifiers.map((modifier) =>
            tx.orderItemModifierOption.create({
              data: {
                orderItemId: orderItem.id,
                optionId: modifier.optionId,
                name: modifier.name,
                priceDelta: modifier.priceDelta,
              },
            }),
          ),
        ),
      );

      return tx.order.findUnique({
        where: { id: created.id },
        include: { items: { include: { food: true, selectedOptions: true } }, table: true, payment: true },
      });
    });

    const createPayload = {
      restaurantId: order.restaurantId,
      orderId: order.id,
      tableId: order.tableId,
      sessionToken: order.guestSessionId,
      source: order.source,
      totalAmount,
      subtotal,
      discountAmount,
      couponCode,
      targets:
        order.source === ORDER_SOURCE.CASHIER
          ? [`kitchen:${order.restaurantId}`, `waiter:${order.restaurantId}`]
          : [`kitchen:${order.restaurantId}`],
    };
    await publishEvent(EVENTS.ORDER_CREATED, createPayload);
    await publishEvent(order.source === ORDER_SOURCE.CASHIER ? EVENTS.CASHIER_ORDER_CREATED : EVENTS.CUSTOMER_ORDER_CREATED, createPayload);
    if (order.payment?.status === PAYMENT_STATUS.SUCCESS) {
      await publishEvent(EVENTS.PAYMENT_SUCCESS, {
        restaurantId: order.restaurantId,
        paymentId: order.payment.id,
        orderId: order.id,
        amount: order.payment.amount,
        sessionToken: order.guestSessionId,
        targets: [`customer:${order.guestSessionId}`, `cashier:${order.restaurantId}`],
      });
    }
    return order;
  },

  async list(user, query = {}) {
    const restaurantId = resolveRestaurantId(user, query.restaurantId);
    const where = {
      restaurantId,
      status: query.status,
      guestSessionId: query.guestSessionId,
    };

    return prisma.order.findMany({
      where,
      include: { items: { include: { food: true, selectedOptions: true } }, table: true, payment: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async get(user, orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { food: true, selectedOptions: true } }, table: true, payment: true },
    });
    if (!order) throw new HttpError(404, "Order not found");
    ensureTenantAccess(user, order.restaurantId);
    return order;
  },

  async getGuestStatus(guestSessionId) {
    return prisma.order.findMany({
      where: { guestSessionId },
      include: { items: { include: { food: true, selectedOptions: true } }, table: true, payment: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async updateStatus(user, orderId, status) {
    ensureStatusOwner(user, status);

    const order = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id: orderId } });
      if (!current) throw new HttpError(404, "Order not found");
      ensureTenantAccess(user, current.restaurantId);

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status },
        include: { items: { include: { food: true, selectedOptions: true } }, table: true, payment: true },
      });

      if ([ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED].includes(status) && current.tableId) {
        await tx.table.update({ where: { id: current.tableId }, data: { status: TABLE_STATUS.AVAILABLE } });
      }
      if (status === ORDER_STATUS.CANCELLED && current.status !== ORDER_STATUS.CANCELLED) {
        await restoreInventoryForOrder(tx, orderId);
      }

      return updated;
    });

    await publishEvent(EVENTS.ORDER_STATUS_CHANGED, {
      restaurantId: order.restaurantId,
      orderId,
      status,
      tableId: order.tableId,
      sessionToken: order.guestSessionId,
      targets: [`customer:${order.guestSessionId}`, `waiter:${order.restaurantId}`, `kitchen:${order.restaurantId}`],
    });
    if (status === ORDER_STATUS.READY) {
      const tableName = order.table?.name || order.tableId || "unknown table";
      await prisma.notification.create({
        data: {
          restaurantId: order.restaurantId,
          type: "ORDER_READY",
          message: `Order ${order.id} is ready for ${tableName}`,
        },
      });
      await publishEvent(EVENTS.ORDER_READY, {
        restaurantId: order.restaurantId,
        orderId,
        tableId: order.tableId,
        sessionToken: order.guestSessionId,
        targets: [`customer:${order.guestSessionId}`, `waiter:${order.restaurantId}`],
      });
    }
    if (status === ORDER_STATUS.SERVED) {
      await publishEvent(EVENTS.ORDER_SERVED, {
        restaurantId: order.restaurantId,
        orderId,
        tableId: order.tableId,
        sessionToken: order.guestSessionId,
        targets: [`customer:${order.guestSessionId}`],
      });
    }
    if (status === ORDER_STATUS.COMPLETED) {
      await publishEvent(EVENTS.ORDER_COMPLETED, { restaurantId: order.restaurantId, orderId, totalAmount: order.totalAmount });
    }

    return order;
  },
};
