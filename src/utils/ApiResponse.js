/**
 * @class ApiResponse
 * @classdesc Class representing an API response
 * @param {number} statusCode - Response status code
 * @param {Object} data - Response data
 * @param {string} message - Response message
 * @returns {ApiResponse}
 */
class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export { ApiResponse };
