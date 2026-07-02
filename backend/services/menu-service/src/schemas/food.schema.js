import { z } from "zod";

const numericString = z
  .union([z.number(), z.string()])
  .transform((value) => Number(value))
  .pipe(z.number().nonnegative());

const optionalNumericString = z
  .union([z.number(), z.string()])
  .optional()
  .transform((value) => (value === undefined || value === "" ? undefined : Number(value)))
  .pipe(z.number().nonnegative().optional());

export const publicFoodListSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    restaurantId: z.string().uuid(),
    categoryId: z.string().uuid().optional(),
    search: z.string().optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().nonnegative().optional(),
    availableOnly: z.coerce.boolean().optional(),
    vegetarian: z.coerce.boolean().optional(),
    vegan: z.coerce.boolean().optional(),
    halal: z.coerce.boolean().optional(),
    spicy: z.coerce.boolean().optional(),
    glutenFree: z.coerce.boolean().optional(),
    nutFree: z.coerce.boolean().optional(),
    lang: z.enum(["mn", "en", "cn"]).optional(),
  }),
});

export const createFoodSchema = z.object({
  body: z.object({
    restaurantId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    name: z.string().min(1).max(150),
    nameI18n: z.object({
      mn: z.string().max(150).optional(),
      en: z.string().max(150).optional(),
      cn: z.string().max(150).optional(),
    }).optional(),
    description: z.string().max(1000).optional(),
    descriptionI18n: z.object({
      mn: z.string().max(1000).optional(),
      en: z.string().max(1000).optional(),
      cn: z.string().max(1000).optional(),
    }).optional(),
    price: numericString,
    discountPrice: optionalNumericString,
    imageUrl: z.string().url().optional(),
    ingredients: z.array(z.string()).optional(),
    allergens: z.array(z.string()).optional(),
    isAvailable: z.boolean().optional(),
    trackInventory: z.boolean().optional(),
    stockQuantity: z.number().int().nonnegative().nullable().optional(),
    isVegetarian: z.boolean().optional(),
    isVegan: z.boolean().optional(),
    isHalal: z.boolean().optional(),
    isSpicy: z.boolean().optional(),
    isGlutenFree: z.boolean().optional(),
    isNutFree: z.boolean().optional(),
    preparationTime: z.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateFoodSchema = z.object({
  body: createFoodSchema.shape.body.partial(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const foodIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const uploadFoodImageSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});
