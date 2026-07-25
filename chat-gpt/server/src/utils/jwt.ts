import jwt from "jsonwebtoken";
import env from "../config/env.js";
import type { AccessTokenPayload, RefreshTokenPayload } from "../types/auth";

const accessTokenOptions: jwt.SignOptions = {
  expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"]
};

const refreshTokenOptions: jwt.SignOptions = {
  expiresIn: env.REFRESH_TOKEN_TTL as jwt.SignOptions["expiresIn"]
};

export function signAccessToken(payload: Omit<AccessTokenPayload, "type">): string {
  return jwt.sign(
    { ...payload, type: "access" },
    env.JWT_ACCESS_SECRET,
    accessTokenOptions
  );
}

export function signRefreshToken(payload: Omit<RefreshTokenPayload, "type">): string {
  return jwt.sign(
    { ...payload, type: "refresh" },
    env.JWT_REFRESH_SECRET,
    refreshTokenOptions
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}
