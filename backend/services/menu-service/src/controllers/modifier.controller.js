import asyncHandler from "express-async-handler";
import { sendSuccess } from "../../../../shared/utils/response.js";
import { modifierService } from "../services/modifier.service.js";

export const listModifierGroups = asyncHandler(async (req, res) => {
  sendSuccess(res, await modifierService.list(req.user, req.validated.params.foodId));
});

export const createModifierGroup = asyncHandler(async (req, res) => {
  sendSuccess(res, await modifierService.createGroup(req.user, req.validated.params.foodId, req.validated.body), 201);
});

export const updateModifierGroup = asyncHandler(async (req, res) => {
  sendSuccess(res, await modifierService.updateGroup(req.user, req.validated.params.groupId, req.validated.body));
});

export const deleteModifierGroup = asyncHandler(async (req, res) => {
  sendSuccess(res, await modifierService.deleteGroup(req.user, req.validated.params.groupId));
});

export const createModifierOption = asyncHandler(async (req, res) => {
  sendSuccess(res, await modifierService.createOption(req.user, req.validated.params.groupId, req.validated.body), 201);
});

export const updateModifierOption = asyncHandler(async (req, res) => {
  sendSuccess(res, await modifierService.updateOption(req.user, req.validated.params.optionId, req.validated.body));
});

export const deleteModifierOption = asyncHandler(async (req, res) => {
  sendSuccess(res, await modifierService.deleteOption(req.user, req.validated.params.optionId));
});
