import { prisma } from "../config/prisma.js";
import { logger } from "../utils/logger.js";

export const auditService = {
  async record({ req, action, entity, entityId, oldValue, newValue, restaurantId }) {
    try {
      return await prisma.auditLog.create({
        data: {
          restaurantId: restaurantId || req?.user?.restaurantId,
          userId: req?.user?.userId,
          action,
          entity,
          entityId,
          oldValue,
          newValue,
          ipAddress: req?.ip,
          userAgent: req?.headers?.["user-agent"],
        },
      });
    } catch (error) {
      logger.error({ message: "Failed to write audit log", action, error });
      return null;
    }
  },
};
