import { prisma } from "../../../../shared/config/prisma.js";
import { HttpError } from "../../../../shared/utils/httpError.js";
import { publishEvent } from "../../../../shared/utils/eventBus.js";
import { EVENTS } from "../../../../shared/constants/events.js";
import { ROLES } from "../../../../shared/constants/permissions.js";
import { ensureTenantAccess, resolveRestaurantId } from "../../../../shared/utils/tenant.js";

export const notificationService = {
  async list(user) {
    const where = user.role === ROLES.SUPER_ADMIN ? {} : { restaurantId: user.restaurantId };
    return prisma.notification.findMany({ where, orderBy: { createdAt: "desc" } });
  },

  async create(user, payload) {
    const restaurantId = resolveRestaurantId(user, payload.restaurantId);
    if (!restaurantId) throw new HttpError(400, "restaurantId is required");
    ensureTenantAccess(user, restaurantId);

    return prisma.notification.create({
      data: { restaurantId, type: payload.type, message: payload.message },
    });
  },

  async markRead(user, notificationId) {
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) throw new HttpError(404, "Notification not found");
    ensureTenantAccess(user, notification.restaurantId);

    return prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
  },

  async createWaiterCall(payload) {
    const requestType = payload.requestType === "BILL" ? "REQUEST_BILL" : payload.requestType === "WAITER" ? "CALL_WAITER" : payload.requestType;
    const table = payload.tableId
      ? await prisma.table.findFirst({
        where: { id: payload.tableId, restaurantId: payload.restaurantId },
        select: { name: true, number: true },
      })
      : null;
    const tableLabel = table?.number || table?.name || payload.tableId || "unknown";
    const message = `${requestType} from table ${tableLabel}${payload.note ? `: ${payload.note}` : ""}`;
    const notification = await prisma.notification.create({
      data: {
        restaurantId: payload.restaurantId,
        type: requestType,
        message,
      },
    });

    await publishEvent(EVENTS.WAITER_CALL, {
      restaurantId: payload.restaurantId,
      tableId: payload.tableId,
      guestSessionId: payload.guestSessionId,
      requestType,
      notificationId: notification.id,
      targets: [`waiter:${payload.restaurantId}`],
    });
    await publishEvent(EVENTS.SERVICE_REQUESTED, {
      restaurantId: payload.restaurantId,
      tableId: payload.tableId,
      requestType,
      targets: [`waiter:${payload.restaurantId}`],
    });

    return notification;
  },
};
