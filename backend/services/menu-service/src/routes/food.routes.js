import { Router } from "express";
import { authenticate, requirePermissions } from "../../../../shared/middlewares/auth.js";
import { validate } from "../../../../shared/middlewares/validate.js";
import { PERMISSIONS } from "../../../../shared/constants/permissions.js";
import { uploadFoodImage as multerFoodImage } from "../middlewares/upload.middleware.js";
import { createFood, deleteFood, publicListFoods, updateFood, uploadFoodImage } from "../controllers/food.controller.js";
import { createFoodSchema, foodIdSchema, publicFoodListSchema, updateFoodSchema, uploadFoodImageSchema } from "../schemas/food.schema.js";

export const foodRouter = Router();

foodRouter.get("/public", validate(publicFoodListSchema), publicListFoods);
foodRouter.post("/", authenticate, requirePermissions(PERMISSIONS.MANAGE_MENU), validate(createFoodSchema), createFood);
foodRouter.patch(
  "/:id",
  authenticate,
  requirePermissions(PERMISSIONS.MANAGE_MENU),
  validate(updateFoodSchema),
  updateFood,
);
foodRouter.delete("/:id", authenticate, requirePermissions(PERMISSIONS.MANAGE_MENU), validate(foodIdSchema), deleteFood);
foodRouter.post(
  "/:id/image",
  authenticate,
  requirePermissions(PERMISSIONS.MANAGE_MENU),
  validate(uploadFoodImageSchema),
  multerFoodImage.single("image"),
  uploadFoodImage,
);
