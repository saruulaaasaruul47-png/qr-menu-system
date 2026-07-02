import { prisma } from "../../../../shared/config/prisma.js";
import { HttpError } from "../../../../shared/utils/httpError.js";
import { ROLES } from "../../../../shared/constants/permissions.js";

const SUPER_ADMIN_AUDIT_ACTIONS = ["RESTAURANT_CREATED", "RESTAURANT_DELETED", "RESTAURANT_REGISTERED"];

export const auditLogService = {
  async list(user, query = {}) {
    const restaurantId = user.role === ROLES.SUPER_ADMIN ? query.restaurantId : user.restaurantId;
    if (!restaurantId && user.role !== ROLES.SUPER_ADMIN) throw new HttpError(400, "restaurantId is required");

    const superAdminRestaurantAuditOnly = user.role === ROLES.SUPER_ADMIN && !query.restaurantId && !query.action && !query.entity;

    return prisma.auditLog.findMany({
      where: {
        restaurantId,
        userId: query.userId,
        action: superAdminRestaurantAuditOnly ? { in: SUPER_ADMIN_AUDIT_ACTIONS } : query.action,
        entity: superAdminRestaurantAuditOnly ? "Restaurant" : query.entity,
        createdAt: {
          gte: query.from ? new Date(query.from) : undefined,
          lte: query.to ? new Date(query.to) : undefined,
        },
      },
      orderBy: { createdAt: "desc" },
      take: query.limit || 50,
    });
  },
};
