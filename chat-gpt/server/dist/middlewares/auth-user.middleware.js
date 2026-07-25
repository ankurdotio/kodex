"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authUserMiddleware = authUserMiddleware;
const api_error_1 = require("../utils/api-error");
const jwt_1 = require("../utils/jwt");
function authUserMiddleware(req, _res, next) {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) {
        throw new api_error_1.ApiError(401, "Authorization header is required");
    }
    const [scheme, token] = authorizationHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
        throw new api_error_1.ApiError(401, "Invalid authorization format");
    }
    try {
        const payload = (0, jwt_1.verifyAccessToken)(token);
        if (payload.type !== "access") {
            throw new api_error_1.ApiError(401, "Invalid access token type");
        }
        req.user = payload;
        next();
    }
    catch {
        throw new api_error_1.ApiError(401, "Invalid or expired access token");
    }
}
