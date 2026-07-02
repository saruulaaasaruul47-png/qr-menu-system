import { prisma } from "../../../../shared/config/prisma.js";
import { publishEvent } from "../../../../shared/utils/eventBus.js";
import { mailer } from "../../../../shared/utils/mailer.js";
import { EVENTS } from "../../../../shared/constants/events.js";
import { renderEmail } from "../templates/email.templates.js";

export const emailService = {
  async send(payload) {
    const html = renderEmail(payload);
    const notification = await prisma.notification.create({
      data: {
        restaurantId: payload.restaurantId,
        type: payload.template,
        message: `Email queued to ${payload.to}: ${payload.subject}`,
      },
    });

    await publishEvent(EVENTS.EMAIL_QUEUED, {
      restaurantId: payload.restaurantId,
      notificationId: notification.id,
      to: payload.to,
      template: payload.template,
    });

    const delivery = await mailer.send({
      to: payload.to,
      subject: payload.subject,
      html,
    });

    if (delivery.delivery === "mock") {
      return {
        notification,
        delivery: "mock",
        message: "SMTP is not configured. Email was queued and logged.",
      };
    }

    await publishEvent(EVENTS.EMAIL_SENT, {
      restaurantId: payload.restaurantId,
      notificationId: notification.id,
      messageId: delivery.messageId,
    });

    return { notification, delivery: "sent", messageId: delivery.messageId };
  },
};
