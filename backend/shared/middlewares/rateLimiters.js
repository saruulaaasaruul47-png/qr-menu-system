import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${req.body?.email || "anonymous"}`,
  message: { success: false, message: "Too many auth requests. Try again later." },
});

export const tenantRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 180,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const tenant = req.headers["x-restaurant-id"] || req.user?.restaurantId || req.query.restaurantId || "public";
    const table = req.headers["x-table-id"] || req.query.tableId || "no-table";
    const session = req.headers["x-guest-session-id"] || req.query.guestSessionId || ipKeyGenerator(req.ip);
    return `${tenant}:${table}:${session}`;
  },
  message: { success: false, message: "Too many requests. Please try again later." },
});
