import { Router } from "express";
import { authenticate, requirePermissions } from "../../../../shared/middlewares/auth.js";
import { validate } from "../../../../shared/middlewares/validate.js";
import { PERMISSIONS } from "../../../../shared/constants/permissions.js";
import {
  createModifierGroup,
  createModifierOption,
  deleteModifierGroup,
  deleteModifierOption,
  listModifierGroups,
  updateModifierGroup,
  updateModifierOption,
} from "../controllers/modifier.controller.js";
import {
  createModifierGroupSchema,
  createModifierOptionSchema,
  foodModifierParamsSchema,
  modifierGroupIdSchema,
  modifierOptionIdSchema,
  updateModifierGroupSchema,
  updateModifierOptionSchema,
} from "../schemas/modifier.schema.js";

export const modifierRouter = Router();

modifierRouter.use(authenticate, requirePermissions(PERMISSIONS.MANAGE_MENU));

modifierRouter.get("/foods/:foodId/modifier-groups", validate(foodModifierParamsSchema), listModifierGroups);
modifierRouter.post("/foods/:foodId/modifier-groups", validate(createModifierGroupSchema), createModifierGroup);
modifierRouter.patch("/modifier-groups/:groupId", validate(updateModifierGroupSchema), updateModifierGroup);
modifierRouter.delete("/modifier-groups/:groupId", validate(modifierGroupIdSchema), deleteModifierGroup);
modifierRouter.post("/modifier-groups/:groupId/options", validate(createModifierOptionSchema), createModifierOption);
modifierRouter.patch("/modifier-options/:optionId", validate(updateModifierOptionSchema), updateModifierOption);
modifierRouter.delete("/modifier-options/:optionId", validate(modifierOptionIdSchema), deleteModifierOption);
