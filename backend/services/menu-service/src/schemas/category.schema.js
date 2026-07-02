import { z } from "zod";

export const publicCategoryListSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    restaurantId: z.string().uuid(),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    restaurantId: z.string().uuid().optional(),
    name: z.string().min(1).max(100),
    description: z.string().max(300).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(300).optional(),
  }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const categoryIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});
