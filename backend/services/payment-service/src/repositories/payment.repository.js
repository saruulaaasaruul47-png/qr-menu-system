import { prisma } from "../../../../shared/config/prisma.js";

export const paymentRepository = {
  transaction(work) {
    return prisma.$transaction(work);
  },

  findOrderWithPayment(orderId) {
    return prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
  },

  findOrderSession(orderId) {
    return prisma.order.findUnique({ where: { id: orderId }, select: { guestSessionId: true } });
  },

  createPayment(data) {
    return prisma.payment.create({ data });
  },

  findPayment(id) {
    return prisma.payment.findUnique({ where: { id } });
  },

  findPaymentStatus(id) {
    return prisma.payment.findUnique({
      where: { id },
      select: {
        id: true,
        orderId: true,
        provider: true,
        amount: true,
        status: true,
        transactionId: true,
        invoiceNo: true,
        invoiceUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  listPayments(where) {
    return prisma.payment.findMany({ where, orderBy: { createdAt: "desc" } });
  },
};
