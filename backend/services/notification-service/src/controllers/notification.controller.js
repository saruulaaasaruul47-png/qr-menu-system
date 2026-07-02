import asyncHandler from "express-async-handler";
import { sendSuccess } from "../../../../shared/utils/response.js";
import { notificationService } from "../services/notification.service.js";

export const listNotifications = asyncHandler(async (req, res) => {
  sendSuccess(res, await notificationService.list(req.user));
});

export const createNotification = asyncHandler(async (req, res) => {
  sendSuccess(res, await notificationService.create(req.user, req.validated.body), 201);
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  sendSuccess(res, await notificationService.markRead(req.user, req.validated.params.id));
});

export const createWaiterCall = asyncHandler(async (req, res) => {
  sendSuccess(res, await notificationService.createWaiterCall(req.validated.body), 201);
});
