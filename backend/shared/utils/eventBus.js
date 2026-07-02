import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { logger } from "./logger.js";

let channelPromise;
export const EVENT_EXCHANGE = "qr-menu.events";

const createChannel = async () => {
  const { default: amqp } = await import("amqplib");
  const connection = await amqp.connect(env.rabbitMqUrl);
  return connection.createChannel();
};

const getChannel = async () => {
  if (!env.rabbitMqUrl) return null;
  if (!channelPromise) {
    channelPromise = createChannel();
  }
  return channelPromise;
};

export const publishEvent = async (eventName, payload) => {
  const event = {
    type: eventName,
    payload,
    createdAt: new Date().toISOString(),
  };
  const outbox = await prisma.eventOutbox.create({
    data: {
      type: eventName,
      payload: event,
    },
  });

  try {
    const channel = await getChannel();
    if (!channel) {
      logger.info({ message: "Event bus disabled; event logged only", event });
      await prisma.eventOutbox.update({
        where: { id: outbox.id },
        data: { status: "PENDING", attempts: { increment: 1 } },
      });
      return event;
    }

    await channel.assertExchange(EVENT_EXCHANGE, "topic", { durable: true });
    channel.publish(EVENT_EXCHANGE, eventName, Buffer.from(JSON.stringify(event)), {
      persistent: true,
      contentType: "application/json",
      messageId: outbox.id,
    });

    await prisma.eventOutbox.update({
      where: { id: outbox.id },
      data: { status: "PUBLISHED", attempts: { increment: 1 } },
    });

    return event;
  } catch (error) {
    logger.error({ message: "Failed to publish event", eventName, error });
    await prisma.eventOutbox.update({
      where: { id: outbox.id },
      data: {
        status: "FAILED",
        attempts: { increment: 1 },
        lastError: error.message?.slice(0, 190),
      },
    });
    return event;
  }
};

export const markEventProcessed = async ({ eventId, type }) => {
  try {
    await prisma.processedEvent.create({ data: { id: eventId, type } });
    return true;
  } catch (_error) {
    return false;
  }
};
