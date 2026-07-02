export const sendSuccess = (res, data, statusCode = 200, message = "OK") => {
  res.status(statusCode).json({ success: true, message, data });
};

export const sendError = (res, { statusCode = 500, message = "Internal server error", error, details } = {}) => {
  res.status(statusCode).json({
    success: false,
    message,
    error: error || details || message,
    details,
  });
};
