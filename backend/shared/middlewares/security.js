const SECURITY_HEADERS = Object.freeze({
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "X-XSS-Protection": "0",
});

export const securityHeaders = (_req, res, next) => {
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(header, value);
  }
  next();
};
