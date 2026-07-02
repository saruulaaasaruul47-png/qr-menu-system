import { Router } from "express";
import { authenticate, requirePermissions } from "../../../../shared/middlewares/auth.js";
import { validate } from "../../../../shared/middlewares/validate.js";
import { PERMISSIONS } from "../../../../shared/constants/permissions.js";
import { createGuestOrder, getGuestOrderStatus, getOrder, listOrders, updateOrderStatus } from "../controllers/order.controller.js";
import { createOrderSchema, guestOrderStatusSchema, listOrderSchema, orderIdSchema, updateOrderStatusSchema } from "../schemas/order.schema.js";

export const orderRouter = Router();

orderRouter.post("/guest", validate(createOrderSchema), createGuestOrder);
orderRouter.get("/guest/status/:guestSessionId", validate(guestOrderStatusSchema), getGuestOrderStatus);
orderRouter.get("/", authenticate, requirePermissions(PERMISSIONS.VIEW_ORDERS), validate(listOrderSchema), listOrders);
orderRouter.get("/:id", authenticate, requirePermissions(PERMISSIONS.VIEW_ORDERS), validate(orderIdSchema), getOrder);
orderRouter.patch(
  "/:id/status",
  authenticate,
  requirePermissions(PERMISSIONS.UPDATE_ORDER_STATUS),
  validate(updateOrderStatusSchema),
  updateOrderStatus,
);
