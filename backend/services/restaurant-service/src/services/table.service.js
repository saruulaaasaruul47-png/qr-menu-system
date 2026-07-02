import { prisma } from "../../../../shared/config/prisma.js";
import { cache } from "../../../../shared/utils/cache.js";
import { HttpError } from "../../../../shared/utils/httpError.js";
import { ROLES } from "../../../../shared/constants/permissions.js";
import { ensureTenantAccess, resolveRestaurantId } from "../../../../shared/utils/tenant.js";

export const tableService = {
  async list(user) {
    const where = user.role === ROLES.SUPER_ADMIN ? {} : { restaurantId: user.restaurantId };
    return prisma.table.findMany({ where, orderBy: [{ number: "asc" }, { createdAt: "asc" }] });
  },

  async create(user, payload) {
    const restaurantId = resolveRestaurantId(user, payload.restaurantId);
    if (!restaurantId) throw new HttpError(400, "restaurantId is required");
    ensureTenantAccess(user, restaurantId);

    const count = payload.count || 1;
    const lastTable = await prisma.table.findFirst({
      where: { restaurantId },
      orderBy: { number: "desc" },
      select: { number: true },
    });
    const firstNumber = payload.number || Number.parseInt(payload.name || "", 10) || (lastTable?.number || 0) + 1;

    const numbers = Array.from({ length: count }, (_item, index) => firstNumber + index);
    const existing = await prisma.table.findMany({ where: { restaurantId, number: { in: numbers } }, select: { number: true } });
    if (existing.length) {
      throw new HttpError(409, `Table #${existing.map((table) => table.number).join(", #")} already exists`);
    }

    const tables = await prisma.$transaction(
      numbers.map((number) =>
        prisma.table.create({
          data: {
            restaurantId,
            name: count === 1 && payload.name ? payload.name : String(number),
            number,
            capacity: payload.capacity || 1,
            status: payload.status || "AVAILABLE",
            qrCodeUrl: count === 1 ? payload.qrCodeUrl : undefined,
          },
        }),
      ),
    );

    cache.clearByPrefix(`tables:${restaurantId}`);
    return count === 1 ? tables[0] : tables;
  },

  async update(user, tableId, payload) {
    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table) throw new HttpError(404, "Table not found");
    ensureTenantAccess(user, table.restaurantId);

    if (payload.number && payload.number !== table.number) {
      const existing = await prisma.table.findFirst({
        where: { restaurantId: table.restaurantId, number: payload.number, isActive: true, id: { not: tableId } },
      });
      if (existing) throw new HttpError(409, `Table #${payload.number} already exists`);
    }

    const updated = await prisma.table.update({ where: { id: tableId }, data: payload });
    cache.clearByPrefix(`tables:${table.restaurantId}`);
    return updated;
  },

  async remove(user, tableId) {
    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table) throw new HttpError(404, "Table not found");
    ensureTenantAccess(user, table.restaurantId);

    return prisma.table.update({ where: { id: tableId }, data: { isActive: false } });
  },
};
