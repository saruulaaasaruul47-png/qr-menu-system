import asyncHandler from "express-async-handler";
import { verifyAccessToken } from "../utils/tokens.js";
import { HttpError } from "../utils/httpError.js";
import { ROLES } from "../constants/permissions.js";

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "Access token is required");
  }

  req.user = verifyAccessToken(token);
  next();
});

export const requirePermissions = (...permissions) => (req, _res, next) => {
  const userPermissions = req.user?.permissions || [];
  const allowed =
    req.user?.role === ROLES.SUPER_ADMIN ||
    permissions.every((permission) => userPermissions.includes(permission));

  if (!allowed) {
    return next(new HttpError(403, "Permission denied"));
  }

  return next();
};

export const requireTenant = (req, _res, next) => {
  if (!req.user?.restaurantId && req.user?.role !== ROLES.SUPER_ADMIN) {
    return next(new HttpError(403, "restaurantId is required"));
  }
  return next();
};
