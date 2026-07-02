import { z } from "zod";

export const foodModifierParamsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ foodId: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const createModifierGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
    isRequired: z.boolean().optional(),
    minSelect: z.number().int().nonnegative().optional(),
    maxSelect: z.number().int().positive().optional(),
    options: z.array(
      z.object({
        name: z.string().min(1).max(120),
        priceDelta: z.number().nonnegative().optional(),
        isAvailable: z.boolean().optional(),
      }),
    ).optional(),
  }),
  params: z.object({ foodId: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const updateModifierGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120).optional(),
    isRequired: z.boolean().optional(),
    minSelect: z.number().int().nonnegative().optional(),
    maxSelect: z.number().int().positive().optional(),
  }),
  params: z.object({ groupId: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const modifierGroupIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ groupId: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const createModifierOptionSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
    priceDelta: z.number().nonnegative().optional(),
    isAvailable: z.boolean().optional(),
  }),
  params: z.object({ groupId: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const updateModifierOptionSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120).optional(),
    priceDelta: z.number().nonnegative().optional(),
    isAvailable: z.boolean().optional(),
  }),
  params: z.object({ optionId: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const modifierOptionIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ optionId: z.string().uuid() }),
  query: z.object({}).optional(),
});
