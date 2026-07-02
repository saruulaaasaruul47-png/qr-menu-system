import asyncHandler from "express-async-handler";
import { sendSuccess } from "../../../../shared/utils/response.js";
import { eventOutboxService } from "../services/eventOutbox.service.js";

export const listEventOutbox = asyncHandler(async (req, res) => {
  sendSuccess(res, await eventOutboxService.list(req.validated.query));
});

export const retryEvent = asyncHandler(async (req, res) => {
  sendSuccess(res, await eventOutboxService.retry(req.validated.params.id));
});
