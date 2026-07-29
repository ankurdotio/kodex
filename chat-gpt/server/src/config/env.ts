import "dotenv/config";
import type { AppEnv } from "../types/env";



function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export const env: AppEnv = {
  port: Number(process.env.PORT ?? 5000),
  mongoUri: required("MONGODB_URI"),
  nodeEnv: process.env.NODE_ENV ?? "development",
  jwtAccessSecret: required("JWT_ACCESS_SECRET", "dev_access_secret"),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET", "dev_refresh_secret"),
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? "15m",
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL ?? "7d",
  refreshCookieName: process.env.REFRESH_COOKIE_NAME ?? "refreshToken",
  mistralApiKey: required("MISTRAL_API_KEY"),
  tvlyApiKey: required("TVLY_API_KEY")
};

export const isProduction = env.nodeEnv === "production";
