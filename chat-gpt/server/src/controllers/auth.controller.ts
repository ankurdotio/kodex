import type { Request, Response } from "express";
import { Types } from "mongoose";
import { env, isProduction } from "../config/env";
import { userDao } from "../dao/user.dao";
import { sessionDao } from "../dao/session.dao";
import { ApiError } from "../utils/api-error";
import { asyncHandler } from "../utils/async-handler";
import { ApiResponse } from "../utils/api-response";
import {
  comparePassword,
  generateRandomToken,
  hashPassword,
  sha256
} from "../utils/crypto";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../utils/jwt";
import { sendmail } from "../utils/sendmail";
import type {
  ForgotPasswordRequest,
  LoginUserRequest,
  RegisterUserRequest,
  ResetPasswordRequest,
  UserResponse
} from "../types/user";

function sanitizeUser(user: { _id: string; name: string; email: string; verified?: boolean }): UserResponse {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    verified: !!user.verified
  };
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/"
  };
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createSessionAndTokens(params: {
  userId: string;
  email: string;
  name: string;
  verified: boolean;
  userAgent: string;
  ipAddress: string;
}) {
  const sessionId = new Types.ObjectId().toString();
  const refreshToken = signRefreshToken({ userId: params.userId, sessionId });
  const accessToken = signAccessToken({
    userId: params.userId,
    email: params.email,
    name: params.name,
    verified: params.verified
  });

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
  const initialVerified = !env.EMAIL_VERIFICATION;

  const user = await userDao.createUser({
    name: String(name),
    email: String(email).toLowerCase(),
    passwordHash,
    verified: initialVerified
  });

  if (env.EMAIL_VERIFICATION) {
    const otp = generateOtp();
    await userDao.setVerificationOtp(
      user._id.toString(),
      sha256(otp),
      new Date(Date.now() + 15 * 60 * 1000) // 15 minutes expiry
    );

    await sendmail({
      to: user.email,
      subject: "Verify your email address",
      text: `Your email verification OTP is ${otp}. It will expire in 15 minutes.`,
      html: `<p>Your email verification OTP is <strong>${otp}</strong>. It will expire in 15 minutes.</p>`
    });
  }

  const { accessToken, refreshToken } = await createSessionAndTokens({
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    verified: user.verified,
    userAgent: req.headers["user-agent"] ?? "unknown",
    ipAddress: req.ip ?? "unknown"
  });

  res.cookie(env.REFRESH_COOKIE_NAME, refreshToken, cookieOptions());
  
  const message = env.EMAIL_VERIFICATION 
    ? "Registered successfully. Please verify your email with the OTP sent." 
    : "Registered successfully";

  ApiResponse(res, 201, message, {
    accessToken,
    user: sanitizeUser({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      verified: user.verified
    })
  });
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
    name: user.name,
    verified: user.verified,
    userAgent: req.headers["user-agent"] ?? "unknown",
    ipAddress: req.ip ?? "unknown"
  });

  res.cookie(env.REFRESH_COOKIE_NAME, refreshToken, cookieOptions());

  ApiResponse(res, 200, "Logged in successfully", {
    accessToken,
    user: sanitizeUser({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      verified: user.verified
    })
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const incomingToken = req.cookies[env.REFRESH_COOKIE_NAME] ?? "";

  if (!incomingToken) {
    throw new ApiError(401, "Refresh token is required");
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
    email: user.email,
    name: user.name,
    verified: user.verified
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

  res.cookie(env.REFRESH_COOKIE_NAME, nextRefreshToken, cookieOptions());

  ApiResponse(res, 200, "Token refreshed", {
    accessToken: nextAccessToken,
    user: sanitizeUser({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      verified: user.verified
    })
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const incomingToken = req.cookies[env.REFRESH_COOKIE_NAME] ?? "";

  if (incomingToken) {
    try {
      const payload = verifyRefreshToken(incomingToken);
      await sessionDao.revokeById(payload.sessionId);
    } catch {
      // Do not leak token verification details during logout.
    }
  }

  res.clearCookie(env.REFRESH_COOKIE_NAME, cookieOptions());

  ApiResponse(res, 200, "Logged out successfully");
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

    await sendmail({
      to: user.email,
      subject: "Reset your password",
      text: `You requested to reset your password. Use this token: ${rawToken}`,
      html: `<p>You requested to reset your password. Use this token: <strong>${rawToken}</strong></p>`
    });

    ApiResponse(res, 200, "If the account exists, a reset link has been generated.", {
      resetToken: isProduction ? undefined : rawToken
    });
    return;
  }

  ApiResponse(res, 200, "If the account exists, a reset link has been generated.");
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

  ApiResponse(res, 200, "Password reset successfully");
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body as { email: string; otp: string };
  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const user = await userDao.findByEmail(email);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.verified) {
    throw new ApiError(400, "Email is already verified");
  }

  if (
    !user.verificationOtpHash ||
    !user.verificationOtpExpiresAt ||
    user.verificationOtpExpiresAt < new Date() ||
    user.verificationOtpHash !== sha256(String(otp))
  ) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  const updatedUser = await userDao.markEmailAsVerified(user._id.toString());
  if (!updatedUser) {
    throw new ApiError(500, "Failed to update email verification status");
  }

  // Issue new access token with verified: true
  const newAccessToken = signAccessToken({
    userId: updatedUser._id.toString(),
    email: updatedUser.email,
    name: updatedUser.name,
    verified: true
  });

  ApiResponse(res, 200, "Email verified successfully", {
    accessToken: newAccessToken,
    user: sanitizeUser({
      _id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      verified: updatedUser.verified
    })
  });
});

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await userDao.findByEmail(String(email));
  if (!user) {
    ApiResponse(res, 200, "If the email is unregistered or unverified, a verification link has been resent.");
    return;
  }

  if (user.verified) {
    throw new ApiError(400, "Email is already verified");
  }

  const otp = generateOtp();
  await userDao.setVerificationOtp(
    user._id.toString(),
    sha256(otp),
    new Date(Date.now() + 15 * 60 * 1000) // 15 minutes expiry
  );

  await sendmail({
    to: user.email,
    subject: "Verify your email address",
    text: `Your email verification OTP is ${otp}. It will expire in 15 minutes.`,
    html: `<p>Your email verification OTP is <strong>${otp}</strong>. It will expire in 15 minutes.</p>`
  });

  ApiResponse(res, 200, "If the email is unregistered or unverified, a verification link has been resent.");
});

export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  await sessionDao.revokeAllByUser(user.userId);
  ApiResponse(res, 200, "Logged out from all sessions successfully");
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.user;
  if (!payload) {
    throw new ApiError(401, "Unauthorized");
  }

  const user = await userDao.findById(payload.userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  ApiResponse(res, 200, "User details fetched successfully", {
    user: sanitizeUser({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      verified: user.verified
    })
  });
});
