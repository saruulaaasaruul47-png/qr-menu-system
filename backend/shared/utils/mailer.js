import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

const createTransporter = () => {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) return null;

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    requireTLS: env.smtpPort === 587,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
};

export const mailer = {
  async send({ to, subject, html, text }) {
    const transporter = createTransporter();
    if (!transporter) {
      logger.warn({ message: "SMTP is not configured; email was not sent", to, subject, missing: {
        host: !env.smtpHost,
        user: !env.smtpUser,
        pass: !env.smtpPass,
      } });
      return { delivery: "skipped", reason: "smtp_not_configured" };
    }

    try {
      const fallbackFrom = env.smtpUser ? `QR Menu <${env.smtpUser}>` : env.smtpFrom;
      const info = await transporter.sendMail({
        from: env.smtpFrom || fallbackFrom,
        to,
        subject,
        html,
        text,
      });

      logger.info({ message: "Email sent", to, subject, messageId: info.messageId });
      return { delivery: "sent", messageId: info.messageId };
    } catch (error) {
      const fallbackFrom = env.smtpUser ? `QR Menu <${env.smtpUser}>` : "";
      if (fallbackFrom && env.smtpFrom && env.smtpFrom !== fallbackFrom) {
        try {
          const info = await transporter.sendMail({
            from: fallbackFrom,
            to,
            subject,
            html,
            text,
          });
          logger.info({ message: "Email sent with fallback sender", to, subject, messageId: info.messageId });
          return { delivery: "sent", messageId: info.messageId };
        } catch (fallbackError) {
          logger.error({ message: "Email fallback send failed", to, subject, error: fallbackError });
        }
      }
      logger.error({ message: "Email send failed", to, subject, error });
      return { delivery: "failed", reason: error.message };
    }
  },
};
