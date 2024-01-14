/**
 * @class ApiError
 * @extends Error
 * @param {number} statusCode
 * @param {Array} errors
 * @param {string} message
 * @param {string} stack
 * @returns {ApiError}
 */
class ApiError extends Error {
  constructor(
    statusCode,
    errors = [],
    message = "Something went wrong",
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
