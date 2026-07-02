import { Server } from "socket.io";
import { env } from "../../../../shared/config/env.js";
import { prisma } from "../../../../shared/config/prisma.js";
import { REALTIME_EVENTS } from "../../../../shared/constants/events.js";
import { EVENT_EXCHANGE } from "../../../../shared/utils/eventBus.js";
import { logger } from "../../../../shared/utils/logger.js";

const realtimeEvents = new Set(REALTIME_EVENTS);

const roomForTarget = (target) => {
  if (!target || typeof target !== "string") return null;
  const [type, id] = target.split(":");
  if (!type || !id) return null;
  return `${type}:${id}`;
};

const emitEvent = (io, event) => {
  if (!event?.type || !realtimeEvents.has(event.type)) return;

  const payload = event.payload || {};
  const rooms = new Set();

  if (payload.restaurantId) rooms.add(`restaurant:${payload.restaurantId}`);
  if (payload.sessionToken) rooms.add(`customer:${payload.sessionToken}`);
  if (Array.isArray(payload.targets)) {
    payload.targets.map(roomForTarget).filter(Boolean).forEach((room) => rooms.add(room));
  }

  const message = { type: event.type, payload, createdAt: event.createdAt || new Date().toISOString() };
  rooms.forEach((room) => {
    io.to(room).emit("realtime:event", message);
    io.to(room).emit(event.type, payload);
  });
};

const subscribeRabbitMq = async (io) => {
  if (!env.rabbitMqUrl) return false;

  const { default: amqp } = await import("amqplib");
  const connection = await amqp.connect(env.rabbitMqUrl);
  const channel = await connection.createChannel();
  await channel.assertExchange(EVENT_EXCHANGE, "topic", { durable: true });
  const queue = await channel.assertQueue("qr-menu.realtime", { durable: true });

  for (const eventName of realtimeEvents) {
    await channel.bindQueue(queue.queue, EVENT_EXCHANGE, eventName);
  }

  channel.consume(queue.queue, (message) => {
    if (!message) return;
    try {
      emitEvent(io, JSON.parse(message.content.toString()));
      channel.ack(message);
    } catch (error) {
      logger.error({ message: "Realtime event consume failed", error });
      channel.nack(message, false, false);
    }
  });

  logger.info("Socket.IO realtime bridge connected to RabbitMQ");
  return true;
};

const startOutboxFallback = (io) => {
  const seen = new Set();

  setInterval(async () => {
    try {
      const events = await prisma.eventOutbox.findMany({
        where: { type: { in: [...realtimeEvents] } },
        orderBy: { createdAt: "desc" },
        take: 60,
      });

      events.reverse().forEach((row) => {
        if (seen.has(row.id)) return;
        seen.add(row.id);
        if (seen.size > 500) seen.delete(seen.values().next().value);
        emitEvent(io, row.payload);
      });
    } catch (error) {
      logger.error({ message: "Realtime outbox fallback failed", error });
    }
  }, 1200);

  logger.info("Socket.IO realtime bridge using eventOutbox fallback");
};

export const initRealtime = async (server) => {
  const io = new Server(server, {
    cors: {
      origin: env.corsOrigin === "*" ? true : env.corsOrigin,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("join", ({ restaurantId, sessionToken, role } = {}) => {
      if (restaurantId) {
        socket.join(`restaurant:${restaurantId}`);
        if (role === "KITCHEN") socket.join(`kitchen:${restaurantId}`);
        if (role === "WAITER") socket.join(`waiter:${restaurantId}`);
        if (role === "CASHIER") socket.join(`cashier:${restaurantId}`);
      }
      if (sessionToken) socket.join(`customer:${sessionToken}`);
      socket.emit("realtime:joined", { restaurantId, sessionToken, role });
    });
  });

  try {
    const connected = await subscribeRabbitMq(io);
    if (!connected) startOutboxFallback(io);
  } catch (error) {
    logger.error({ message: "RabbitMQ realtime bridge unavailable; falling back to outbox", error });
    startOutboxFallback(io);
  }

  return io;
};
