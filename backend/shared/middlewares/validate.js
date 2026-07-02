export const validate =
  (schema) =>
  (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      return next({
        statusCode: 400,
        message: "Validation failed",
        details: result.error.flatten(),
      });
    }

    req.validated = result.data;
    return next();
  };
