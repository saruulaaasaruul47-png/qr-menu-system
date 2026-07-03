import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../../../shared/config/prisma.js";
import { env } from "../../../../shared/config/env.js";
import { cache } from "../../../../shared/utils/cache.js";
import { logger } from "../../../../shared/utils/logger.js";
import { HttpError } from "../../../../shared/utils/httpError.js";
import { mailer } from "../../../../shared/utils/mailer.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../../../shared/utils/tokens.js";
import { DEFAULT_ROLE_PERMISSIONS, ROLES } from "../../../../shared/constants/permissions.js";

const safeUser = (user) => {
  const { password, ...publicUser } = user;
  return publicUser;
};

const PLAN_LIMITS = Object.freeze({
  FREE: 10,
  STANDARD: 200,
  PREMIUM: 999999,
});
const RESET_CODE_TTL_MS = 15 * 60 * 1000;
const RESET_TOKEN_TTL = "10m";

const resetCacheKey = (email) => `password-reset:${email}`;
const createResetCode = () => String(Math.floor(100000 + Math.random() * 900000));

const createPasswordResetEmail = ({ name, code }) => {
  const text = [
    `Hi ${name || "there"},`,
    "",
    `Your QR Menu password reset code is: ${code}`,
    "",
    "This code expires in 15 minutes.",
  ].join("\n");

  return {
    subject: "Your QR Menu password reset code",
    text,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
        <h2>Password reset</h2>
        <p>Hi ${name || "there"},</p>
        <p>Use this 6-digit code to reset your QR Menu password. It expires in 15 minutes.</p>
        <p style="font-size:28px;letter-spacing:6px;font-weight:700;background:#f8fafc;padding:14px;border-radius:8px;text-align:center">${code}</p>
      </div>
    `,
  };
};

export const authService = {
  async register({ restaurant, owner, subscription }) {
    const existingUser = await prisma.user.findUnique({ where: { email: owner.email } });
    if (existingUser) throw new HttpError(409, "Email is already registered");

    const plan = subscription?.plan || "FREE";
    const password = await bcrypt.hash(owner.password, env.bcryptSaltRounds);

    const result = await prisma.$transaction(async (tx) => {
      const createdRestaurant = await tx.restaurant.create({
        data: {
          ...restaurant,
          subscription: {
            create: {
              plan,
              foodLimit: PLAN_LIMITS[plan],
              isActive: true,
              expiresAt: subscription?.expiresAt ? new Date(subscription.expiresAt) : undefined,
            },
          },
        },
        include: { subscription: true },
      });

      const createdOwner = await tx.user.create({
        data: {
          restaurantId: createdRestaurant.id,
          name: owner.name,
          email: owner.email,
          password,
          role: ROLES.OWNER,
          permissions: DEFAULT_ROLE_PERMISSIONS.OWNER,
        },
      });

      return { restaurant: createdRestaurant, user: safeUser(createdOwner) };
    });

    cache.set(`auth:user:${result.user.id}`, result.user, 5 * 60 * 1000);

    return {
      ...result,
      accessToken: signAccessToken(result.user),
      refreshToken: signRefreshToken(result.user),
    };
  },

  async login({ email, password }) {
    const loginId = email.trim();
    const normalizedLoginId = loginId.toLowerCase();
    const user = loginId.includes("@")
      ? await prisma.user.findUnique({ where: { email: normalizedLoginId } })
      : await prisma.user.findFirst({
          where: {
            OR: [
              { name: { equals: loginId, mode: "insensitive" } },
              { email: { startsWith: `${normalizedLoginId}@` } },
            ],
          },
        });
    if (!user) {
      logger.warn({ message: "Login failed", reason: "user_not_found", loginId });
      throw new HttpError(401, "Invalid email or password");
    }
    if (!user.isActive) {
      logger.warn({ message: "Login failed", reason: "inactive_user", loginId, userId: user.id });
      throw new HttpError(401, "Invalid email or password");
    }

    const passwordMatches =
      await bcrypt.compare(password, user.password) ||
      (password.trim() !== password && await bcrypt.compare(password.trim(), user.password));
    if (!passwordMatches) {
      logger.warn({ message: "Login failed", reason: "password_mismatch", loginId, userId: user.id });
      throw new HttpError(401, "Invalid email or password");
    }

    const publicUser = safeUser(user);
    cache.set(`auth:user:${user.id}`, publicUser, 5 * 60 * 1000);

    return {
      user: publicUser,
      accessToken: signAccessToken(publicUser),
      refreshToken: signRefreshToken(publicUser),
    };
  },

  async refresh(refreshToken) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new HttpError(401, "Invalid or expired refresh token");
    }
    if (payload.type !== "refresh") throw new HttpError(401, "Invalid or expired refresh token");
    const user = await this.me(payload.userId);

    return {
      accessToken: signAccessToken(user),
      refreshToken: signRefreshToken(user),
    };
  },

  async me(userId) {
    const cachedUser = cache.get(`auth:user:${userId}`);
    if (cachedUser) return cachedUser;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) throw new HttpError(404, "User not found");

    const publicUser = safeUser(user);
    cache.set(`auth:user:${userId}`, publicUser, 5 * 60 * 1000);
    return publicUser;
  },

  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new HttpError(404, "User not found");

    const passwordMatches = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatches) throw new HttpError(400, "Current password is incorrect");

    const hashedPassword = await bcrypt.hash(newPassword, env.bcryptSaltRounds);
    await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
    cache.del(`auth:user:${userId}`);

    return { message: "Password changed successfully" };
  },

  async createPasswordResetToken(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new HttpError(404, "Email is not registered");
    if (!user.isActive) throw new HttpError(400, "This account is inactive");

    const code = createResetCode();
    const codeHash = await bcrypt.hash(code, env.bcryptSaltRounds);
    cache.set(resetCacheKey(email), { userId: user.id, email, codeHash }, RESET_CODE_TTL_MS);

    const delivery = await mailer.send({
      to: user.email,
      ...createPasswordResetEmail({ name: user.name, code }),
    });

    if (delivery.delivery !== "sent") {
      throw new HttpError(
        delivery.reason === "smtp_not_configured" ? 503 : 500,
        delivery.reason === "smtp_not_configured"
          ? "Email service is not configured"
          : "Password reset email could not be sent",
      );
    }

    return { message: "Password reset code sent" };
  },

  async verifyPasswordResetCode(email, code) {
    const reset = cache.get(resetCacheKey(email));
    if (!reset) throw new HttpError(400, "Invalid or expired reset code");

    const codeMatches = await bcrypt.compare(code, reset.codeHash);
    if (!codeMatches) throw new HttpError(400, "Invalid or expired reset code");

    const resetToken = jwt.sign({ userId: reset.userId, email, type: "password-reset" }, env.jwtRefreshSecret, {
      expiresIn: RESET_TOKEN_TTL,
    });

    return { message: "Reset code verified", resetToken };
  },

  async resetPassword(resetToken, newPassword) {
    let payload;
    try {
      payload = jwt.verify(resetToken, env.jwtRefreshSecret);
    } catch {
      throw new HttpError(400, "Invalid or expired reset token");
    }
    if (payload.type !== "password-reset") throw new HttpError(400, "Invalid reset token");

    const hashedPassword = await bcrypt.hash(newPassword, env.bcryptSaltRounds);
    await prisma.user.update({ where: { id: payload.userId }, data: { password: hashedPassword } });
    cache.del(`auth:user:${payload.userId}`);
    if (payload.email) cache.del(resetCacheKey(payload.email));

    return { message: "Password reset successfully" };
  },
};
