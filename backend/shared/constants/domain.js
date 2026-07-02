export const ORDER_STATUS = Object.freeze({
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  PREPARING: "PREPARING",
  READY: "READY",
  SERVED: "SERVED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
});

export const TABLE_STATUS = Object.freeze({
  AVAILABLE: "AVAILABLE",
  OCCUPIED: "OCCUPIED",
  RESERVED: "RESERVED",
});

export const ORDER_SOURCE = Object.freeze({
  QR: "QR",
  CASHIER: "CASHIER",
  WAITER: "WAITER",
});

export const COUPON_TYPE = Object.freeze({
  PERCENT: "PERCENT",
  FIXED: "FIXED",
});
