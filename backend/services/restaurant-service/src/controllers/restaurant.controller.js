import asyncHandler from "express-async-handler";
import { sendSuccess } from "../../../../shared/utils/response.js";
import { auditService } from "../../../../shared/services/audit.service.js";
import { restaurantService } from "../services/restaurant.service.js";

export const listRestaurants = asyncHandler(async (req, res) => {
  sendSuccess(res, await restaurantService.list(req.user));
});

export const getPublicRestaurant = asyncHandler(async (req, res) => {
  sendSuccess(res, await restaurantService.publicProfile(req.validated.params.id));
});

export const getRestaurant = asyncHandler(async (req, res) => {
  sendSuccess(res, await restaurantService.get(req.user, req.validated.params.id));
});

export const createRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await restaurantService.create(req.validated.body);
  await auditService.record({
    req,
    action: "RESTAURANT_CREATED",
    entity: "Restaurant",
    entityId: restaurant.id,
    newValue: restaurant,
    restaurantId: restaurant.id,
  });
  sendSuccess(res, restaurant, 201);
});

export const updateRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await restaurantService.update(req.user, req.validated.params.id, req.validated.body);
  await auditService.record({
    req,
    action: "RESTAURANT_UPDATED",
    entity: "Restaurant",
    entityId: restaurant.id,
    newValue: restaurant,
    restaurantId: restaurant.id,
  });
  sendSuccess(res, restaurant);
});

export const deleteRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await restaurantService.remove(req.user, req.validated.params.id);
  await auditService.record({
    req,
    action: "RESTAURANT_DELETED",
    entity: "Restaurant",
    entityId: restaurant.id,
    oldValue: restaurant,
    restaurantId: restaurant.id,
  });
  sendSuccess(res, restaurant);
});
