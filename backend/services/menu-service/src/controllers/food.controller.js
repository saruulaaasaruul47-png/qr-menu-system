import asyncHandler from "express-async-handler";
import { sendSuccess } from "../../../../shared/utils/response.js";
import { auditService } from "../../../../shared/services/audit.service.js";
import { foodService } from "../services/food.service.js";

export const publicListFoods = asyncHandler(async (req, res) => {
  sendSuccess(res, await foodService.publicList(req.validated.query));
});

export const createFood = asyncHandler(async (req, res) => {
  const food = await foodService.create(req.user, req.validated.body);
  await auditService.record({ req, action: "FOOD_CREATED", entity: "Food", entityId: food.id, newValue: food, restaurantId: food.restaurantId });
  sendSuccess(res, food, 201);
});

export const updateFood = asyncHandler(async (req, res) => {
  const food = await foodService.update(req.user, req.validated.params.id, req.validated.body);
  await auditService.record({
    req,
    action: req.validated.body.price || req.validated.body.discountPrice ? "PRICE_CHANGED" : "MENU_UPDATED",
    entity: "Food",
    entityId: food.id,
    newValue: food,
    restaurantId: food.restaurantId,
  });
  sendSuccess(res, food);
});

export const deleteFood = asyncHandler(async (req, res) => {
  const result = await foodService.remove(req.user, req.validated.params.id);
  await auditService.record({ req, action: "MENU_UPDATED", entity: "Food", entityId: req.validated.params.id, newValue: result });
  sendSuccess(res, result);
});

export const uploadFoodImage = asyncHandler(async (req, res) => {
  sendSuccess(res, await foodService.attachImage(req.user, req.validated.params.id, req.file));
});
