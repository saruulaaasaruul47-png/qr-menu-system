import asyncHandler from "express-async-handler";
import { sendSuccess } from "../../../../shared/utils/response.js";
import { couponService } from "../services/coupon.service.js";

export const listCoupons = asyncHandler(async (req, res) => {
  sendSuccess(res, await couponService.list(req.user, req.validated.query));
});

export const createCoupon = asyncHandler(async (req, res) => {
  sendSuccess(res, await couponService.create(req.user, req.validated.body), 201);
});

export const updateCoupon = asyncHandler(async (req, res) => {
  sendSuccess(res, await couponService.update(req.user, req.validated.params.id, req.validated.body));
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  sendSuccess(res, await couponService.remove(req.user, req.validated.params.id));
});

export const validateCoupon = asyncHandler(async (req, res) => {
  sendSuccess(res, await couponService.validate(req.validated.query));
});
