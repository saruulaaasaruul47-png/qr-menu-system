import asyncHandler from "express-async-handler";
import { sendSuccess } from "../../../../shared/utils/response.js";
import { auditService } from "../../../../shared/services/audit.service.js";
import { authService } from "../services/auth.service.js";

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.validated.body);
  await auditService.record({
    req,
    action: "RESTAURANT_REGISTERED",
    entity: "Restaurant",
    entityId: result.restaurant.id,
    newValue: {
      restaurant: result.restaurant,
      owner: result.user,
    },
    restaurantId: result.restaurant.id,
  });
  sendSuccess(res, result, 201);
});

export const login = asyncHandler(async (req, res) => {
  sendSuccess(res, await authService.login(req.validated.body));
});

export const refreshToken = asyncHandler(async (req, res) => {
  sendSuccess(res, await authService.refresh(req.validated.body.refreshToken));
});

export const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, await authService.me(req.user.userId));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.validated.body;
  sendSuccess(res, await authService.changePassword(req.user.userId, currentPassword, newPassword));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  sendSuccess(res, await authService.createPasswordResetToken(req.validated.body.email));
});

export const verifyResetCode = asyncHandler(async (req, res) => {
  const { email, code } = req.validated.body;
  sendSuccess(res, await authService.verifyPasswordResetCode(email, code));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.validated.body;
  sendSuccess(res, await authService.resetPassword(resetToken, newPassword));
});

export const logout = asyncHandler(async (_req, res) => {
  sendSuccess(res, { message: "Logged out successfully" });
});
