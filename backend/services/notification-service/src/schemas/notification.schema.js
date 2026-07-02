import { z } from "zod";

export const createNotificationSchema = z.object({
  body: z.object({
    restaurantId: z.string().uuid().optional(),
    type: z.string().min(2).max(80),
    message: z.string().min(2).max(500),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const notificationIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const waiterCallSchema = z.object({
  body: z.object({
    restaurantId: z.string().uuid(),
    tableId: z.string().min(1).max(120),
    guestSessionId: z.string().min(1).max(120),
    requestType: z.enum(["CALL_WAITER", "REQUEST_WATER", "REQUEST_CUTLERY", "REQUEST_BILL", "CLEAN_TABLE", "BILL", "WAITER"]),
    note: z.string().max(300).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
