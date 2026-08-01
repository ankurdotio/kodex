import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AccessTokenPayload, RefreshTokenPayload } from "../types/auth";

const accessTokenOptions: jwt.SignOptions = {
  expiresIn: env.accessTokenTtl as jwt.SignOptions["expiresIn"]
};

const refreshTokenOptions: jwt.SignOptions = {
  expiresIn: env.refreshTokenTtl as jwt.SignOptions["expiresIn"]
};

export function signAccessToken(payload: Omit<AccessTokenPayload, "type">): string {
  return jwt.sign(
    { ...payload, type: "access" },
    env.jwtAccessSecret,
    accessTokenOptions
  );
}

export function signRefreshToken(payload: Omit<RefreshTokenPayload, "type">): string {
  return jwt.sign(
    { ...payload, type: "refresh" },
    env.jwtRefreshSecret,
    refreshTokenOptions
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwtAccessSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as RefreshTokenPayload;
}
