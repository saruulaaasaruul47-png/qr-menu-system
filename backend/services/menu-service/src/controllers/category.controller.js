import asyncHandler from "express-async-handler";
import { sendSuccess } from "../../../../shared/utils/response.js";
import { categoryService } from "../services/category.service.js";

export const publicListCategories = asyncHandler(async (req, res) => {
  sendSuccess(res, await categoryService.publicList(req.validated.query.restaurantId));
});

export const createCategory = asyncHandler(async (req, res) => {
  sendSuccess(res, await categoryService.create(req.user, req.validated.body), 201);
});

export const updateCategory = asyncHandler(async (req, res) => {
  sendSuccess(res, await categoryService.update(req.user, req.validated.params.id, req.validated.body));
});

export const deleteCategory = asyncHandler(async (req, res) => {
  sendSuccess(res, await categoryService.remove(req.user, req.validated.params.id));
});
