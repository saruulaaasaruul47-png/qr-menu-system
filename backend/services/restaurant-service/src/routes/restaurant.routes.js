import { Router } from "express";
import { authenticate, requirePermissions } from "../../../../shared/middlewares/auth.js";
import { validate } from "../../../../shared/middlewares/validate.js";
import { PERMISSIONS } from "../../../../shared/constants/permissions.js";
import { emptyRequestSchema } from "../../../../shared/schemas/request.schema.js";
import {
  createRestaurant,
  deleteRestaurant,
  getRestaurant,
  getPublicRestaurant,
  listRestaurants,
  updateRestaurant,
} from "../controllers/restaurant.controller.js";
import { createRestaurantSchema, restaurantIdSchema, updateRestaurantSchema } from "../schemas/restaurant.schema.js";

export const restaurantRouter = Router();

restaurantRouter.get("/public/:id", validate(restaurantIdSchema), getPublicRestaurant);

restaurantRouter.use(authenticate);
restaurantRouter.get("/", requirePermissions(PERMISSIONS.MANAGE_RESTAURANT), validate(emptyRequestSchema), listRestaurants);
restaurantRouter.get("/:id", requirePermissions(PERMISSIONS.MANAGE_RESTAURANT), validate(restaurantIdSchema), getRestaurant);
restaurantRouter.post(
  "/",
  requirePermissions(PERMISSIONS.MANAGE_ALL_RESTAURANTS),
  validate(createRestaurantSchema),
  createRestaurant,
);
restaurantRouter.patch(
  "/:id",
  requirePermissions(PERMISSIONS.MANAGE_RESTAURANT),
  validate(updateRestaurantSchema),
  updateRestaurant,
);
restaurantRouter.delete(
  "/:id",
  requirePermissions(PERMISSIONS.MANAGE_ALL_RESTAURANTS),
  validate(restaurantIdSchema),
  deleteRestaurant,
);
