import { COUPON_TYPE } from "../constants/domain.js";

export const normalizeCouponCode = (code = "") => code.trim().toUpperCase();

export const calculateDiscount = (coupon, subtotal) => {
  const rawDiscount = coupon.type === COUPON_TYPE.FIXED
    ? coupon.discountValue
    : subtotal * (coupon.discountValue / 100);
  const capped = coupon.maxDiscountAmount ? Math.min(rawDiscount, coupon.maxDiscountAmount) : rawDiscount;
  return Math.max(0, Math.min(subtotal, Number(capped.toFixed(2))));
};
