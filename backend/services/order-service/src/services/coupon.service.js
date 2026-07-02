import { prisma } from "../../../../shared/config/prisma.js";
import { COUPON_TYPE } from "../../../../shared/constants/domain.js";
import { ROLES } from "../../../../shared/constants/permissions.js";
import { HttpError } from "../../../../shared/utils/httpError.js";
import { ensureTenantAccess, resolveRestaurantId } from "../../../../shared/utils/tenant.js";

export const normalizeCouponCode = (code = "") => code.trim().toUpperCase();

export const calculateDiscount = (coupon, subtotal) => {
  const rawDiscount = coupon.type === COUPON_TYPE.FIXED
    ? coupon.discountValue
    : subtotal * (coupon.discountValue / 100);
  const capped = coupon.maxDiscountAmount ? Math.min(rawDiscount, coupon.maxDiscountAmount) : rawDiscount;
  return Math.max(0, Math.min(subtotal, Number(capped.toFixed(2))));
};

export const assertCouponUsable = (coupon, subtotal) => {
  if (!coupon || !coupon.isActive) throw new HttpError(404, "Coupon is not available");
  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) throw new HttpError(400, "Coupon is not active yet");
  if (coupon.expiresAt && coupon.expiresAt < now) throw new HttpError(400, "Coupon has expired");
  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
    throw new HttpError(400, `Minimum order amount is ${coupon.minOrderAmount}`);
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new HttpError(400, "Coupon usage limit reached");
};

export const couponService = {
  async list(user, query = {}) {
    const restaurantId = resolveRestaurantId(user, query.restaurantId);
    return prisma.coupon.findMany({
      where: user.role === ROLES.SUPER_ADMIN && !restaurantId ? {} : { restaurantId },
      orderBy: { createdAt: "desc" },
    });
  },

  async create(user, payload) {
    const restaurantId = resolveRestaurantId(user, payload.restaurantId);
    ensureTenantAccess(user, restaurantId);
    return prisma.coupon.create({
      data: {
        restaurantId,
        code: normalizeCouponCode(payload.code),
        type: payload.type,
        discountValue: payload.discountValue,
        minOrderAmount: payload.minOrderAmount,
        maxDiscountAmount: payload.maxDiscountAmount,
        usageLimit: payload.usageLimit,
        startsAt: payload.startsAt ? new Date(payload.startsAt) : undefined,
        expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : undefined,
        isActive: payload.isActive ?? true,
      },
    });
  },

  async update(user, id, payload) {
    const current = await prisma.coupon.findUnique({ where: { id } });
    if (!current) throw new HttpError(404, "Coupon not found");
    ensureTenantAccess(user, current.restaurantId);

    return prisma.coupon.update({
      where: { id },
      data: {
        code: payload.code ? normalizeCouponCode(payload.code) : undefined,
        type: payload.type,
        discountValue: payload.discountValue,
        minOrderAmount: payload.minOrderAmount,
        maxDiscountAmount: payload.maxDiscountAmount,
        usageLimit: payload.usageLimit,
        startsAt: payload.startsAt ? new Date(payload.startsAt) : payload.startsAt,
        expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : payload.expiresAt,
        isActive: payload.isActive,
      },
    });
  },

  async remove(user, id) {
    const current = await prisma.coupon.findUnique({ where: { id } });
    if (!current) throw new HttpError(404, "Coupon not found");
    ensureTenantAccess(user, current.restaurantId);
    await prisma.coupon.delete({ where: { id } });
    return { id };
  },

  async validate({ restaurantId, code, subtotal }) {
    const normalizedCode = normalizeCouponCode(code);
    const coupon = await prisma.coupon.findUnique({
      where: { restaurantId_code: { restaurantId, code: normalizedCode } },
    });
    assertCouponUsable(coupon, subtotal);
    return {
      couponId: coupon.id,
      code: coupon.code,
      type: coupon.type,
      discountValue: coupon.discountValue,
      discountAmount: calculateDiscount(coupon, subtotal),
    };
  },
};
