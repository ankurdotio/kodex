"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = ApiResponse;
/**
 * Sends a standardized API response.
 *
 * @param res Express Response object
 * @param statusCode HTTP status code
 * @param message Response message
 * @param data Optional response payload data (defaults to empty object)
 */
function ApiResponse(res, statusCode, message, data = {}) {
    res.status(statusCode).json({
        success: statusCode >= 200 && statusCode < 300,
        message,
        data
    });
}
