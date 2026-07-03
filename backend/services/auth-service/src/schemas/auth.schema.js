import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().min(2).max(150),
    password: z.string().min(8),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const registerSchema = z.object({
  body: z.object({
    restaurant: z.object({
      name: z.string().min(2).max(150),
      description: z.string().max(500).optional(),
      logoUrl: z.string().url().optional(),
      bannerUrl: z.string().url().optional(),
      faviconUrl: z.string().url().optional(),
      themeColor: z.string().max(30).optional(),
      font: z.string().max(80).optional(),
      phone: z.string().max(30).optional(),
      address: z.string().max(250).optional(),
      qrDesign: z.record(z.string(), z.unknown()).optional(),
    }),
    owner: z.object({
      name: z.string().min(2).max(100),
      email: z.string().email().toLowerCase(),
      password: z.string().min(8),
    }),
    subscription: z.object({
      plan: z.enum(["FREE", "STANDARD", "PREMIUM"]).default("FREE"),
      expiresAt: z.string().datetime().optional(),
    }).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(20),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().email().toLowerCase(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    resetToken: z.string().trim().min(20),
    newPassword: z.string().min(8),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const verifyResetCodeSchema = z.object({
  body: z.object({
    email: z.string().trim().email().toLowerCase(),
    code: z.string().trim().regex(/^\d{6}$/, "Code must be 6 digits"),
    resetSessionToken: z.string().trim().min(20).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
