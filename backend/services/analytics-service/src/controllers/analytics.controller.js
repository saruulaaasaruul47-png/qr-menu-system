import asyncHandler from "express-async-handler";
import { sendSuccess } from "../../../../shared/utils/response.js";
import { analyticsService } from "../services/analytics.service.js";

export const ingestEvent = asyncHandler(async (req, res) => {
  sendSuccess(res, await analyticsService.ingest(req.validated.body), 201);
});

export const getMetrics = asyncHandler(async (req, res) => {
  sendSuccess(res, await analyticsService.metrics(req.user, req.validated.query));
});
