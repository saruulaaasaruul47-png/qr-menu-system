import { Router } from "express";
import { authenticate } from "../../../../shared/middlewares/auth.js";
import { validate } from "../../../../shared/middlewares/validate.js";
import { emptyRequestSchema } from "../../../../shared/schemas/request.schema.js";
import {
  changePassword,
  forgotPassword,
  getMe,
  login,
  logout,
  register,
  refreshToken,
  resetPassword,
  verifyResetCode,
} from "../controllers/auth.controller.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  resetPasswordSchema,
  verifyResetCodeSchema,
} from "../schemas/auth.schema.js";

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/refresh-token", validate(refreshTokenSchema), refreshToken);
authRouter.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
authRouter.post("/verify-reset-code", validate(verifyResetCodeSchema), verifyResetCode);
authRouter.post("/reset-password", validate(resetPasswordSchema), resetPassword);
authRouter.post("/logout", authenticate, validate(emptyRequestSchema), logout);
authRouter.get("/me", authenticate, validate(emptyRequestSchema), getMe);
authRouter.patch("/change-password", authenticate, validate(changePasswordSchema), changePassword);
