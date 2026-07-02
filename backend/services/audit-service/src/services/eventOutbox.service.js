import { prisma } from "../../../../shared/config/prisma.js";
import { HttpError } from "../../../../shared/utils/httpError.js";
import { publishEvent } from "../../../../shared/utils/eventBus.js";

export const eventOutboxService = {
  async list(query = {}) {
    return prisma.eventOutbox.findMany({
      where: { status: query.status, type: query.type },
      orderBy: { createdAt: "desc" },
      take: query.limit || 50,
    });
  },

  async retry(id) {
    const event = await prisma.eventOutbox.findUnique({ where: { id } });
    if (!event) throw new HttpError(404, "Event not found");
    if (event.status === "PUBLISHED") throw new HttpError(400, "Event is already published");

    return publishEvent(event.type, event.payload?.payload || event.payload);
  },
};
