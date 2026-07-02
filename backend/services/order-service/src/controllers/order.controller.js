import asyncHandler from "express-async-handler";
import { sendSuccess } from "../../../../shared/utils/response.js";
import { auditService } from "../../../../shared/services/audit.service.js";
import { orderService } from "../services/order.service.js";

export const createGuestOrder = asyncHandler(async (req, res) => {
  sendSuccess(res, await orderService.createGuestOrder(req.validated.body), 201);
});

export const listOrders = asyncHandler(async (req, res) => {
  sendSuccess(res, await orderService.list(req.user, req.validated.query));
});

export const getGuestOrderStatus = asyncHandler(async (req, res) => {
  sendSuccess(res, await orderService.getGuestStatus(req.validated.params.guestSessionId));
});

export const getOrder = asyncHandler(async (req, res) => {
  sendSuccess(res, await orderService.get(req.user, req.validated.params.id));
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateStatus(req.user, req.validated.params.id, req.validated.body.status);
  await auditService.record({
    req,
    action: req.validated.body.status === "CANCELLED" ? "ORDER_CANCELLED" : "ORDER_STATUS_CHANGED",
    entity: "Order",
    entityId: order.id,
    newValue: order,
    restaurantId: order.restaurantId,
  });
  sendSuccess(res, order);
});
