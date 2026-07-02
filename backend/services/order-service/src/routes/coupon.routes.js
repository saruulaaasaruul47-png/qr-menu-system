import { Router } from "express";
import { PERMISSIONS } from "../../../../shared/constants/permissions.js";
import { authenticate, requirePermissions } from "../../../../shared/middlewares/auth.js";
import { validate } from "../../../../shared/middlewares/validate.js";
import { createCoupon, deleteCoupon, listCoupons, updateCoupon, validateCoupon } from "../controllers/coupon.controller.js";
import { couponIdSchema, createCouponSchema, listCouponSchema, updateCouponSchema, validateCouponSchema } from "../schemas/coupon.schema.js";

export const couponRouter = Router();

couponRouter.get("/public/validate", validate(validateCouponSchema), validateCoupon);
couponRouter.use(authenticate, requirePermissions(PERMISSIONS.MANAGE_MENU));
couponRouter.get("/", validate(listCouponSchema), listCoupons);
couponRouter.post("/", validate(createCouponSchema), createCoupon);
couponRouter.patch("/:id", validate(updateCouponSchema), updateCoupon);
couponRouter.delete("/:id", validate(couponIdSchema), deleteCoupon);
