import { z } from "zod";

const optionalUrl = z.preprocess(
  (value) => value === "" ? null : value,
  z.string().url().nullable().optional(),
);

export const createRestaurantSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(150),
    description: z.string().max(500).optional(),
    logoUrl: optionalUrl,
    bannerUrl: optionalUrl,
    faviconUrl: optionalUrl,
    themeColor: z.string().max(30).optional(),
    font: z.string().max(80).optional(),
    qrDesign: z.record(z.string(), z.unknown()).optional(),
    phone: z.string().max(30).optional(),
    address: z.string().max(250).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateRestaurantSchema = z.object({
  body: createRestaurantSchema.shape.body.partial().extend({
    isActive: z.boolean().optional(),
  }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const restaurantIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});
