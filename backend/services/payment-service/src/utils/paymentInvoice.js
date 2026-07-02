export const createInvoiceUrl = (paymentId) => `/invoices/${paymentId}.pdf`;

export const createInvoiceNo = () => `INV-${Date.now()}`;

export const createDemoTransactionId = () => `DEMO-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
