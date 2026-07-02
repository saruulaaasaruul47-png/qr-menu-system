import "dotenv/config";
import amqp from "amqplib";
import { prisma } from "../shared/config/prisma.js";
import { env } from "../shared/config/env.js";
import { EVENTS } from "../shared/constants/events.js";
import { logger } from "../shared/utils/logger.js";
import { EVENT_EXCHANGE, markEventProcessed } from "../shared/utils/eventBus.js";

const queue = "qr-menu.consumer.core";
const routingKeys = [
  EVENTS.ORDER_CREATED,
  EVENTS.CUSTOMER_ORDER_CREATED,
  EVENTS.CASHIER_ORDER_CREATED,
  EVENTS.ORDER_READY,
  EVENTS.ORDER_SERVED,
  EVENTS.ORDER_COMPLETED,
  EVENTS.PAYMENT_SUCCESS,
  EVENTS.PAYMENT_FAILED,
  EVENTS.WAITER_CALL,
  EVENTS.QR_SCANNED,
];

const notificationMessage = (event) => {
  const payload = event.payload || {};
  switch (event.type) {
    case EVENTS.ORDER_CREATED:
    case EVENTS.CUSTOMER_ORDER_CREATED:
    case EVENTS.CASHIER_ORDER_CREATED:
      return `New ${payload.source || "QR"} order ${payload.orderId}`;
    case EVENTS.ORDER_READY:
      return `Order ${payload.orderId} is ready`;
    case EVENTS.ORDER_SERVED:
      return `Order ${payload.orderId} was served`;
    case EVENTS.PAYMENT_SUCCESS:
      return `Payment received for order ${payload.orderId}`;
    case EVENTS.PAYMENT_FAILED:
      return `Payment failed for order ${payload.orderId}`;
    case EVENTS.WAITER_CALL:
      return `Waiter call from table ${payload.tableId || "unknown"}`;
    default:
      return null;
  }
};

const handleEvent = async (event, eventId) => {
  const payload = event.payload || {};
  const restaurantId = payload.restaurantId;
  if (!restaurantId) return;

  await prisma.analyticsEvent.create({
    data: {
      restaurantId,
      type: event.type,
      payload: event,
    },
  });

  const message = notificationMessage(event);
  if (message) {
    await prisma.notification.create({
      data: {
        restaurantId,
        type: event.type,
        message,
      },
    });
  }

  logger.info({ message: "Event consumed", eventId, type: event.type, restaurantId });
};

const main = async () => {
  if (!env.rabbitMqUrl) {
    logger.warn("RABBITMQ_URL is empty; event consumer is disabled");
    return;
  }

  const connection = await amqp.connect(env.rabbitMqUrl);
  const channel = await connection.createChannel();
  await channel.assertExchange(EVENT_EXCHANGE, "topic", { durable: true });
  await channel.assertQueue(queue, { durable: true });
  await Promise.all(routingKeys.map((key) => channel.bindQueue(queue, EVENT_EXCHANGE, key)));

  channel.consume(queue, async (message) => {
    if (!message) return;
    const eventId = message.properties.messageId || `${message.fields.routingKey}:${message.fields.deliveryTag}`;
    try {
      const isNew = await markEventProcessed({ eventId, type: message.fields.routingKey });
      if (!isNew) {
        channel.ack(message);
        return;
      }
      const event = JSON.parse(message.content.toString("utf8"));
      await handleEvent(event, eventId);
      channel.ack(message);
    } catch (error) {
      logger.error({ message: "Event consumer failed", eventId, error });
      channel.nack(message, false, true);
    }
  });

  logger.info({ message: "Event consumer started", queue, routingKeys });
};

main().catch((error) => {
  logger.error({ message: "Event consumer crashed", error });
  process.exit(1);
});
