/**
 * API Response Standard Envelopes
 */

export function successResponse(res, data = {}, message = "Success", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
}

export function errorResponse(res, message = "An error occurred", statusCode = 400, errors = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString()
  });
}
