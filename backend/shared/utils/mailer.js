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
      logger.warn({ message: "SMTP is not configured; email was not sent", to, subject });
      return { delivery: "mock" };
    }

    const info = await transporter.sendMail({
      from: env.smtpFrom,
      to,
      subject,
      html,
      text,
    });

    return { delivery: "sent", messageId: info.messageId };
  },
};
