import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const normalizeServiceUrl = (rawUrl) => {
  if (!rawUrl) return "";
  const withProtocol = /^https?:\/\//i.test(rawUrl)
    ? rawUrl
    : `${process.env.NODE_ENV === "production" ? "https" : "http"}://${rawUrl}`;

  try {
    const parsed = new URL(withProtocol);
    return parsed.origin;
  } catch {
    return withProtocol.replace(/\/+$/, "");
  }
};

const splitUrls = (value, fallback) =>
  (value || fallback)
    .split(",")
    .map((url) => normalizeServiceUrl(url.trim()))
    .filter(Boolean);

const corsOrigin = (value) => {
  if (!value || value === "*") return "*";
  const origins = value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return origins.length === 1 ? origins[0] : origins;
};

const firstOrigin = (value) => {
  if (!value || value === "*") return "";
  const origin = Array.isArray(value) ? value[0] : value.split(",")[0]?.trim();
  if (!origin) return "";

  try {
    return new URL(origin).origin;
  } catch {
    return origin.replace(/\/+$/, "");
  }
};

const servicePort = (servicePortValue, fallback) =>
  Number(servicePortValue || (process.env.NODE_ENV === "production" ? process.env.PORT : "") || fallback);

const resolvedCorsOrigin = corsOrigin(process.env.CORS_ORIGIN);
const defaultPublicUrl = process.env.NODE_ENV === "production"
  ? firstOrigin(resolvedCorsOrigin) || "https://qr-menu-system-lemon.vercel.app"
  : "http://localhost:5173";

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: resolvedCorsOrigin,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "change-this-access-secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "change-this-refresh-secret",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 12),
  apiGatewayPort: servicePort(process.env.API_GATEWAY_PORT, 3000),
  authServicePort: servicePort(process.env.AUTH_SERVICE_PORT, 3001),
  restaurantServicePort: servicePort(process.env.RESTAURANT_SERVICE_PORT, 3002),
  menuServicePort: servicePort(process.env.MENU_SERVICE_PORT, 3003),
  orderServicePort: servicePort(process.env.ORDER_SERVICE_PORT, 3004),
  paymentServicePort: servicePort(process.env.PAYMENT_SERVICE_PORT, 3005),
  notificationServicePort: servicePort(process.env.NOTIFICATION_SERVICE_PORT, 3006),
  analyticsServicePort: servicePort(process.env.ANALYTICS_SERVICE_PORT, 3007),
  qrServicePort: servicePort(process.env.QR_SERVICE_PORT, 3008),
  loyaltyServicePort: servicePort(process.env.LOYALTY_SERVICE_PORT, 3009),
  auditServicePort: servicePort(process.env.AUDIT_SERVICE_PORT, 3010),
  rabbitMqUrl: process.env.RABBITMQ_URL || "",
  appPublicUrl: normalizeServiceUrl(process.env.APP_PUBLIC_URL || defaultPublicUrl),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
  stripeOrderCurrency: (process.env.STRIPE_ORDER_CURRENCY || "mnt").toLowerCase(),
  stripeOrderAmountMultiplier: Number(process.env.STRIPE_ORDER_AMOUNT_MULTIPLIER || 1),
  storageBaseUrl: process.env.STORAGE_BASE_URL || "/uploads",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || (process.env.SMTP_USER ? `QR Menu <${process.env.SMTP_USER}>` : "QR Menu <no-reply@qr-menu.local>"),
  authServiceUrls: splitUrls(process.env.AUTH_SERVICE_URLS, "http://localhost:3001"),
  restaurantServiceUrls: splitUrls(process.env.RESTAURANT_SERVICE_URLS, "http://localhost:3002"),
  menuServiceUrls: splitUrls(process.env.MENU_SERVICE_URLS, "http://localhost:3003"),
  orderServiceUrls: splitUrls(process.env.ORDER_SERVICE_URLS, "http://localhost:3004"),
  paymentServiceUrls: splitUrls(process.env.PAYMENT_SERVICE_URLS, "http://localhost:3005"),
  notificationServiceUrls: splitUrls(process.env.NOTIFICATION_SERVICE_URLS, "http://localhost:3006"),
  analyticsServiceUrls: splitUrls(process.env.ANALYTICS_SERVICE_URLS, "http://localhost:3007"),
  qrServiceUrls: splitUrls(process.env.QR_SERVICE_URLS, "http://localhost:3008"),
  loyaltyServiceUrls: splitUrls(process.env.LOYALTY_SERVICE_URLS, "http://localhost:3009"),
  auditServiceUrls: splitUrls(process.env.AUDIT_SERVICE_URLS, "http://localhost:3010"),
};
