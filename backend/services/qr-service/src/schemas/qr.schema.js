import { z } from "zod";

export const createQrSchema = z.object({
  body: z.object({
    restaurantId: z.string().uuid().optional(),
    tableId: z.string().uuid(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const scanQrSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({
    guestSessionId: z.string().min(8).max(120).optional(),
  }).optional(),
});

export const tableQrSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ tableId: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const listQrScansSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    restaurantId: z.string().uuid().optional(),
    take: z.coerce.number().int().positive().max(200).optional(),
  }).optional(),
});
