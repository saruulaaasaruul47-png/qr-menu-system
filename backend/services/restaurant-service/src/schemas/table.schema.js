import { z } from "zod";

export const createTableSchema = z.object({
  body: z.object({
    restaurantId: z.string().uuid().optional(),
    name: z.string().min(1).max(80).optional(),
    number: z.coerce.number().int().positive().optional(),
    count: z.coerce.number().int().min(1).max(100).optional(),
    capacity: z.coerce.number().int().min(1).max(30).optional(),
    status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED"]).optional(),
    qrCodeUrl: z.string().url().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateTableSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(80).optional(),
    number: z.coerce.number().int().positive().optional(),
    capacity: z.coerce.number().int().min(1).max(30).optional(),
    status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED"]).optional(),
    qrCodeUrl: z.string().url().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const tableIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});
