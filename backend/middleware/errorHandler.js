/**
 * Global Centered Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  console.error("💥 Error caught by middleware:", err);

  // Default error properties
  let statusCode = err.status || 500;
  let message = err.message || "An unexpected server error occurred.";
  let errors = err.errors || null;

  // Handle specific validation errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Input validation failed.";
    errors = Object.values(err.errors).map((e) => e.message);
  }

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message,
    ...(errors && { errors }),
    timestamp: new Date().toISOString(),
  });
}

module.exports = errorHandler;
