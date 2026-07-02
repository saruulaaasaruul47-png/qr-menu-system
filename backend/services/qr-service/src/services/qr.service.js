import QRCode from "qrcode";
import { prisma } from "../../../../shared/config/prisma.js";
import { env } from "../../../../shared/config/env.js";
import { HttpError } from "../../../../shared/utils/httpError.js";
import { publishEvent } from "../../../../shared/utils/eventBus.js";
import { EVENTS } from "../../../../shared/constants/events.js";
import { ROLES } from "../../../../shared/constants/permissions.js";
import { ensureTenantAccess, resolveRestaurantId } from "../../../../shared/utils/tenant.js";

export const qrService = {
  async create(user, payload) {
    const restaurantId = resolveRestaurantId(user, payload.restaurantId);
    if (!restaurantId) throw new HttpError(400, "restaurantId is required");
    ensureTenantAccess(user, restaurantId);

    const table = await prisma.table.findUnique({ where: { id: payload.tableId } });
    if (!table || table.restaurantId !== restaurantId) throw new HttpError(404, "Table not found");

    const qr = await prisma.qRCode.create({
      data: {
        restaurantId,
        tableId: payload.tableId,
        url: "",
      },
    });

    const scanUrl = `${env.appPublicUrl}/qr/${qr.id}`;
    const menuUrl = `${env.appPublicUrl}/menu/${restaurantId}/table/${payload.tableId}`;
    const dataUrl = await QRCode.toDataURL(scanUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 400,
      color: { dark: "#000000", light: "#ffffff" },
    });

    const updated = await prisma.qRCode.update({
      where: { id: qr.id },
      data: { url: scanUrl },
    });

    await prisma.table.update({ where: { id: payload.tableId }, data: { qrCodeUrl: dataUrl } });
    return { ...updated, scanUrl, menuUrl, qrDataUrl: dataUrl };
  },

  async createForTable(user, tableId) {
    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table) throw new HttpError(404, "Table not found");
    return this.create(user, { restaurantId: table.restaurantId, tableId });
  },

  async scan(qrId, guestSessionId) {
    const qr = await prisma.qRCode.findUnique({ where: { id: qrId } });
    if (!qr) throw new HttpError(404, "QR code not found");

    await prisma.qrScan.create({
      data: {
        restaurantId: qr.restaurantId,
        tableId: qr.tableId,
        qrId,
        guestSessionId,
      },
    });

    await publishEvent(EVENTS.QR_SCANNED, {
      restaurantId: qr.restaurantId,
      tableId: qr.tableId,
      qrId,
      guestSessionId,
    });

    return {
      restaurantId: qr.restaurantId,
      tableId: qr.tableId,
      guestSessionId,
      menuUrl: `${env.appPublicUrl}/menu/${qr.restaurantId}/table/${qr.tableId}`,
    };
  },

  async listScans(user, query = {}) {
    const restaurantId = user.role === ROLES.SUPER_ADMIN ? query.restaurantId : user.restaurantId;
    if (!restaurantId) throw new HttpError(400, "restaurantId is required");
    ensureTenantAccess(user, restaurantId);

    const take = Math.min(Number(query.take || 100), 200);
    const [logs, total] = await Promise.all([
      prisma.qrScan.findMany({
        where: { restaurantId },
        include: { table: true },
        orderBy: { createdAt: "desc" },
        take,
      }),
      prisma.qrScan.count({ where: { restaurantId } }),
    ]);

    return { total, logs };
  },
};
