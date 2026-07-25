"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const api_error_1 = require("../utils/api-error");
const routes_1 = require("../routes");
const env_1 = __importDefault(require("../config/env"));
// Static assets are copied directly to server/public (../../public relative to compiled app.js)
const clientDistPath = path_1.default.join(__dirname, "../../public");
exports.app = (0, express_1.default)();
exports.app.use((0, morgan_1.default)(env_1.default.NODE_ENV === "production" ? "combined" : "dev"));
exports.app.use(express_1.default.json());
exports.app.use(express_1.default.urlencoded({ extended: true }));
exports.app.use((0, cookie_parser_1.default)());
// Serve static frontend assets
exports.app.use(express_1.default.static(clientDistPath));
// Top-level Health Check Routes
exports.app.get("/api/halth", (_req, res) => {
    res.status(200).json({ status: "healthy", message: "Server is healthy" });
});
exports.app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "healthy", message: "Server is healthy" });
});
// API routes
exports.app.use("/api/v1", routes_1.router);
// Wildcard fallback for frontend client routing (Single Page App)
// Compatible with Express 5 / path-to-regexp v8 (wildcards are defined as `/{*name}`)
exports.app.get("/{*splat}", (req, res, next) => {
    if (req.path.startsWith("/api")) {
        return next();
    }
    res.sendFile(path_1.default.join(clientDistPath, "index.html"), (err) => {
        if (err) {
            next(new api_error_1.ApiError(404, "Frontend build index.html not found. Make sure client is built."));
        }
    });
});
// API 404 Route handler
exports.app.use((_req, _res, next) => {
    next(new api_error_1.ApiError(404, "Route not found"));
});
// Global Error Handler
exports.app.use((error, _req, res, _next) => {
    const statusCode = error instanceof api_error_1.ApiError ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : "Internal server error";
    res.status(statusCode).json({ message });
});
