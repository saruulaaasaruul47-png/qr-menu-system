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

const sendWithResend = async ({ to, subject, html, text }) => {
  const from = env.resendFrom || env.smtpFrom;
  if (!env.resendApiKey || !from) return { delivery: "skipped", reason: "resend_not_configured" };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { delivery: "failed", reason: data.message || data.error || `Resend API failed with ${response.status}` };
  }

  return { delivery: "sent", messageId: data.id };
};

export const mailer = {
  async send({ to, subject, html, text }) {
    if (env.resendApiKey) {
      try {
        const delivery = await sendWithResend({ to, subject, html, text });
        if (delivery.delivery === "sent") {
          logger.info({ message: "Email sent with Resend", to, subject, messageId: delivery.messageId });
        } else {
          logger.error({ message: "Resend email send failed", to, subject, reason: delivery.reason });
        }
        return delivery;
      } catch (error) {
        logger.error({ message: "Resend email send failed", to, subject, error });
        return { delivery: "failed", reason: error.message };
      }
    }

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
