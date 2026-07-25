import { Response } from "express";

/**
 * Sends a standardized API response.
 * 
 * @param res Express Response object
 * @param statusCode HTTP status code
 * @param message Response message
 * @param data Optional response payload data (defaults to empty object)
 */
export function ApiResponse(
  res: Response,
  statusCode: number,
  message: string,
  data: any = {}
): void {
  res.status(statusCode).json({
    success: statusCode >= 200 && statusCode < 300,
    message,
    data
  });
}
