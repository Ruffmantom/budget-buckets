// Shared error helpers for consistent API error responses

export class ApiError extends Error {
  constructor(statusCode = 500, message = "Internal server error", details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const notFoundHandler = (req, _res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
};

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const status = err.statusCode || err.status || 500;
  const response = {
    message: err.message || "Internal server error"
  };

  if (err.details) response.details = err.details;
  if (err.errors && typeof err.errors === "object") {
    response.details = response.details || {};
    // Flatten common validation error shapes
    Object.entries(err.errors).forEach(([key, value]) => {
      response.details[key] = value.message || value;
    });
  }

  // Only expose stack traces outside production
  if (process.env.NODE_ENV !== "production" && err.stack) {
    response.stack = err.stack;
  }

  res.status(status).json(response);
};

export default {
  ApiError,
  notFoundHandler,
  errorHandler
};
