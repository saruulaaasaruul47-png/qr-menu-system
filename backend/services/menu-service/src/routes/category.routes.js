import { Router } from "express";
import { authenticate, requirePermissions } from "../../../../shared/middlewares/auth.js";
import { validate } from "../../../../shared/middlewares/validate.js";
import { PERMISSIONS } from "../../../../shared/constants/permissions.js";
import {
  createCategory,
  deleteCategory,
  publicListCategories,
  updateCategory,
} from "../controllers/category.controller.js";
import {
  categoryIdSchema,
  createCategorySchema,
  publicCategoryListSchema,
  updateCategorySchema,
} from "../schemas/category.schema.js";

export const categoryRouter = Router();

categoryRouter.get("/public", validate(publicCategoryListSchema), publicListCategories);
categoryRouter.post("/", authenticate, requirePermissions(PERMISSIONS.MANAGE_MENU), validate(createCategorySchema), createCategory);
categoryRouter.patch(
  "/:id",
  authenticate,
  requirePermissions(PERMISSIONS.MANAGE_MENU),
  validate(updateCategorySchema),
  updateCategory,
);
categoryRouter.delete(
  "/:id",
  authenticate,
  requirePermissions(PERMISSIONS.MANAGE_MENU),
  validate(categoryIdSchema),
  deleteCategory,
);
