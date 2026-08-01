import type { Request, Response } from "express";
import { Types } from "mongoose";
import { env, isProduction } from "../config/env.js";
import { userDao } from "../dao/user.dao.js";
import { sessionDao } from "../dao/session.dao.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  comparePassword,
  generateRandomToken,
  hashPassword,
  sha256
} from "../utils/crypto.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../utils/jwt.js";
import type {
  ForgotPasswordRequest,
  LoginUserRequest,
  RegisterUserRequest,
  ResetPasswordRequest,
  UserResponse
} from "../types/user.js";
import type { AuthSuccessResponse, RefreshTokenResponse } from "../types/auth.js";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/"
  };
}

function sanitizeUser(user: { _id: string; name: string; email: string }): UserResponse {
  return {
    id: user._id,
    name: user.name,
    email: user.email
  };
}

async function createSessionAndTokens(params: {
  userId: string;
  email: string;
  userAgent: string;
  ipAddress: string;
}) {
  const sessionId = new Types.ObjectId().toString();
  const refreshToken = signRefreshToken({ userId: params.userId, sessionId });
  const accessToken = signAccessToken({ userId: params.userId, email: params.email });

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await sessionDao.createSession({
    sessionId,
    userId: params.userId,
    refreshTokenHash: sha256(refreshToken),
    expiresAt,
    userAgent: params.userAgent,
    ipAddress: params.ipAddress
  });

  return { accessToken, refreshToken, sessionId };
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as RegisterUserRequest;
  const existing = await userDao.findByEmail(String(email));
  if (existing) {
    throw new ApiError(409, "User already exists");
  }

  const passwordHash = await hashPassword(String(password));
  const user = await userDao.createUser({
    name: String(name),
    email: String(email).toLowerCase(),
    passwordHash
  });

  const { accessToken, refreshToken } = await createSessionAndTokens({
    userId: user._id.toString(),
    email: user.email,
    userAgent: req.headers["user-agent"] ?? "unknown",
    ipAddress: req.ip ?? "unknown"
  });

  res.cookie(env.refreshCookieName, refreshToken, cookieOptions());
  
  const response: AuthSuccessResponse = {
    message: "Registered successfully",
    accessToken,
    refreshToken,
    user: sanitizeUser({
      _id: user._id.toString(),
      name: user.name,
      email: user.email
    })
  };

  res.status(201).json(response);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginUserRequest;
  const user = await userDao.findByEmail(String(email));
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isValid = await comparePassword(String(password), user.passwordHash);
  if (!isValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await createSessionAndTokens({
    userId: user._id.toString(),
    email: user.email,
    userAgent: req.headers["user-agent"] ?? "unknown",
    ipAddress: req.ip ?? "unknown"
  });

  res.cookie(env.refreshCookieName, refreshToken, cookieOptions());
  const response: AuthSuccessResponse = {
    message: "Logged in successfully",
    accessToken,
    refreshToken,
    user: sanitizeUser({ _id: user._id.toString(), name: user.name, email: user.email })
  };

  res.status(200).json(response);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const incomingToken =
    req.cookies[env.refreshCookieName] ??
    (req.body.refreshToken ? String(req.body.refreshToken) : "");

  if (!incomingToken) {
    res.status(204).send();
    return;
  }

  const payload = verifyRefreshToken(incomingToken);
  if (payload.type !== "refresh") {
    throw new ApiError(401, "Invalid refresh token type");
  }

  const session = await sessionDao.findActiveById(payload.sessionId);
  if (!session) {
    throw new ApiError(401, "Session is not active");
  }

  const user = await userDao.findById(payload.userId);
  if (!user) {
    await sessionDao.revokeById(payload.sessionId);
    throw new ApiError(401, "User not found for session");
  }

  const sameToken = sha256(incomingToken) === session.refreshTokenHash;
  if (!sameToken) {
    await sessionDao.revokeById(payload.sessionId);
    throw new ApiError(401, "Invalid session token");
  }

  await sessionDao.revokeById(payload.sessionId);

  const nextAccessToken = signAccessToken({
    userId: payload.userId,
    email: user.email
  });

  const nextSessionId = new Types.ObjectId().toString();
  const nextRefreshToken = signRefreshToken({ userId: payload.userId, sessionId: nextSessionId });

  await sessionDao.createSession({
    sessionId: nextSessionId,
    userId: payload.userId,
    refreshTokenHash: sha256(nextRefreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userAgent: req.headers["user-agent"] ?? "unknown",
    ipAddress: req.ip ?? "unknown"
  });

  res.cookie(env.refreshCookieName, nextRefreshToken, cookieOptions());
  const response: RefreshTokenResponse = {
    message: "Token refreshed",
    accessToken: nextAccessToken,
    refreshToken: nextRefreshToken,
    user: sanitizeUser({
      _id: user._id.toString(),
      name: user.name,
      email: user.email
    })
  };

  res.status(200).json(response);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const incomingToken =
    req.cookies[env.refreshCookieName] ??
    (req.body.refreshToken ? String(req.body.refreshToken) : "");

  if (incomingToken) {
    try {
      const payload = verifyRefreshToken(incomingToken);
      await sessionDao.revokeById(payload.sessionId);
    } catch {
      // Do not leak token verification details during logout.
    }
  }

  res.clearCookie(env.refreshCookieName, cookieOptions());
  res.status(200).json({ message: "Logged out successfully" });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as ForgotPasswordRequest;
  const user = await userDao.findByEmail(String(email));

  if (user) {
    const rawToken = generateRandomToken();
    await userDao.setResetToken(
      user._id.toString(),
      sha256(rawToken),
      new Date(Date.now() + 15 * 60 * 1000)
    );

    res.status(200).json({
      message: "If the account exists, a reset link has been generated.",
      resetToken: isProduction ? undefined : rawToken
    });
    return;
  }

  res.status(200).json({ message: "If the account exists, a reset link has been generated." });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body as ResetPasswordRequest;
  const user = await userDao.findByValidResetToken(sha256(String(token)));

  if (!user) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  const nextPasswordHash = await hashPassword(String(newPassword));
  await userDao.updatePassword(user._id.toString(), nextPasswordHash);
  await sessionDao.revokeAllByUser(user._id.toString());

  res.status(200).json({ message: "Password reset successfully" });
});
