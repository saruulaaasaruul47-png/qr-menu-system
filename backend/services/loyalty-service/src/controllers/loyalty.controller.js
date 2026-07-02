import asyncHandler from "express-async-handler";
import { sendSuccess } from "../../../../shared/utils/response.js";
import { loyaltyService } from "../services/loyalty.service.js";

export const addPoints = asyncHandler(async (req, res) => {
  sendSuccess(res, await loyaltyService.recordVisit(req.validated.body), 201);
});

export const publicLookup = asyncHandler(async (req, res) => {
  sendSuccess(res, await loyaltyService.publicLookup(req.validated.query));
});

export const lookupLoyalty = asyncHandler(async (req, res) => {
  sendSuccess(res, await loyaltyService.lookup(req.user, req.validated.query));
});

export const deleteLoyaltyData = asyncHandler(async (req, res) => {
  sendSuccess(res, await loyaltyService.deletePersonalData(req.user, req.validated.body));
});
