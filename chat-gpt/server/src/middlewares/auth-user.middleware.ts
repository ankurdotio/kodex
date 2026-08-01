import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function authUserMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    throw new ApiError(401, "Authorization header is required");
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new ApiError(401, "Invalid authorization format");
  }

  try {
    const payload = verifyAccessToken(token);

    if (payload.type !== "access") {
      throw new ApiError(401, "Invalid access token type");
    }

    req.user = payload;
    next();
  } catch {
    throw new ApiError(401, "Invalid or expired access token");
  }
}
