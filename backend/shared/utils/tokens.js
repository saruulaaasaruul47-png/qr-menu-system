import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signAccessToken = (user) =>
  jwt.sign(
    {
      userId: user.id,
      restaurantId: user.restaurantId,
      role: user.role,
      permissions: user.permissions || [],
    },
    env.jwtAccessSecret,
    { expiresIn: env.jwtAccessExpiresIn },
  );

export const signRefreshToken = (user) =>
  jwt.sign({ userId: user.id, type: "refresh" }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  });

export const verifyAccessToken = (token) => jwt.verify(token, env.jwtAccessSecret);
export const verifyRefreshToken = (token) => jwt.verify(token, env.jwtRefreshSecret);
