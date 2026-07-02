import { verifyAccessToken } from "../../../../shared/utils/tokens.js";

export const authMiddleware = (req, _res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next({ statusCode: 401, message: "Access token is required" });
  }

  try {
    const user = verifyAccessToken(token);
    req.user = user;
    req.headers["x-user-id"] = user.userId;
    req.headers["x-restaurant-id"] = user.restaurantId || "";
    req.headers["x-user-role"] = user.role;
    req.headers["x-user-permissions"] = JSON.stringify(user.permissions || []);
    return next();
  } catch (_error) {
    return next({ statusCode: 401, message: "Invalid or expired access token" });
  }
};

export const publicRoute = (_req, _res, next) => next();
