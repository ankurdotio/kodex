import cookieParser from "cookie-parser";
import express from "express";
import morgan from "morgan";
import path from "path";
import { ApiError } from "../utils/api-error";
import { router } from "../routes";
import env from "../config/env";

// Static assets are copied directly to server/public (../../public relative to compiled app.js)
const clientDistPath = path.join(__dirname, "../../public");

export const app = express();

app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static frontend assets
app.use(express.static(clientDistPath));

// Top-level Health Check Routes
app.get("/api/halth", (_req, res) => {
  res.status(200).json({ status: "healthy", message: "Server is healthy" });
});
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "healthy", message: "Server is healthy" });
});

// API routes
app.use("/api/v1", router);

// Wildcard fallback for frontend client routing (Single Page App)
// Compatible with Express 5 / path-to-regexp v8 (wildcards are defined as `/{*name}`)
app.get("/{*splat}", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, "index.html"), (err) => {
    if (err) {
      next(new ApiError(404, "Frontend build index.html not found. Make sure client is built."));
    }
  });
});

// API 404 Route handler
app.use((_req, _res, next) => {
  next(new ApiError(404, "Route not found"));
});

// Global Error Handler
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : "Internal server error";

  res.status(statusCode).json({ message });
});
