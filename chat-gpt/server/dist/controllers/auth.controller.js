"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.logoutAll = exports.resendVerification = exports.verifyEmail = exports.resetPassword = exports.forgotPassword = exports.logout = exports.refresh = exports.login = exports.register = void 0;
const mongoose_1 = require("mongoose");
const env_1 = require("../config/env");
const user_dao_1 = require("../dao/user.dao");
const session_dao_1 = require("../dao/session.dao");
const api_error_1 = require("../utils/api-error");
const async_handler_1 = require("../utils/async-handler");
const api_response_1 = require("../utils/api-response");
const crypto_1 = require("../utils/crypto");
const jwt_1 = require("../utils/jwt");
const sendmail_1 = require("../utils/sendmail");
function sanitizeUser(user) {
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
        sameSite: "lax",
        secure: env_1.isProduction,
        path: "/"
    };
}
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
async function createSessionAndTokens(params) {
    const sessionId = new mongoose_1.Types.ObjectId().toString();
    const refreshToken = (0, jwt_1.signRefreshToken)({ userId: params.userId, sessionId });
    const accessToken = (0, jwt_1.signAccessToken)({
        userId: params.userId,
        email: params.email,
        name: params.name,
        verified: params.verified
    });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await session_dao_1.sessionDao.createSession({
        sessionId,
        userId: params.userId,
        refreshTokenHash: (0, crypto_1.sha256)(refreshToken),
        expiresAt,
        userAgent: params.userAgent,
        ipAddress: params.ipAddress
    });
    return { accessToken, refreshToken, sessionId };
}
exports.register = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { name, email, password } = req.body;
    const existing = await user_dao_1.userDao.findByEmail(String(email));
    if (existing) {
        throw new api_error_1.ApiError(409, "User already exists");
    }
    const passwordHash = await (0, crypto_1.hashPassword)(String(password));
    const initialVerified = !env_1.env.EMAIL_VERIFICATION;
    const user = await user_dao_1.userDao.createUser({
        name: String(name),
        email: String(email).toLowerCase(),
        passwordHash,
        verified: initialVerified
    });
    if (env_1.env.EMAIL_VERIFICATION) {
        const otp = generateOtp();
        await user_dao_1.userDao.setVerificationOtp(user._id.toString(), (0, crypto_1.sha256)(otp), new Date(Date.now() + 15 * 60 * 1000) // 15 minutes expiry
        );
        await (0, sendmail_1.sendmail)({
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
    res.cookie(env_1.env.REFRESH_COOKIE_NAME, refreshToken, cookieOptions());
    const message = env_1.env.EMAIL_VERIFICATION
        ? "Registered successfully. Please verify your email with the OTP sent."
        : "Registered successfully";
    (0, api_response_1.ApiResponse)(res, 201, message, {
        accessToken,
        user: sanitizeUser({
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            verified: user.verified
        })
    });
});
exports.login = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    const user = await user_dao_1.userDao.findByEmail(String(email));
    if (!user) {
        throw new api_error_1.ApiError(401, "Invalid credentials");
    }
    const isValid = await (0, crypto_1.comparePassword)(String(password), user.passwordHash);
    if (!isValid) {
        throw new api_error_1.ApiError(401, "Invalid credentials");
    }
    const { accessToken, refreshToken } = await createSessionAndTokens({
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        verified: user.verified,
        userAgent: req.headers["user-agent"] ?? "unknown",
        ipAddress: req.ip ?? "unknown"
    });
    res.cookie(env_1.env.REFRESH_COOKIE_NAME, refreshToken, cookieOptions());
    (0, api_response_1.ApiResponse)(res, 200, "Logged in successfully", {
        accessToken,
        user: sanitizeUser({
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            verified: user.verified
        })
    });
});
exports.refresh = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const incomingToken = req.cookies[env_1.env.REFRESH_COOKIE_NAME] ?? "";
    if (!incomingToken) {
        throw new api_error_1.ApiError(401, "Refresh token is required");
    }
    const payload = (0, jwt_1.verifyRefreshToken)(incomingToken);
    if (payload.type !== "refresh") {
        throw new api_error_1.ApiError(401, "Invalid refresh token type");
    }
    const session = await session_dao_1.sessionDao.findActiveById(payload.sessionId);
    if (!session) {
        throw new api_error_1.ApiError(401, "Session is not active");
    }
    const user = await user_dao_1.userDao.findById(payload.userId);
    if (!user) {
        await session_dao_1.sessionDao.revokeById(payload.sessionId);
        throw new api_error_1.ApiError(401, "User not found for session");
    }
    const sameToken = (0, crypto_1.sha256)(incomingToken) === session.refreshTokenHash;
    if (!sameToken) {
        await session_dao_1.sessionDao.revokeById(payload.sessionId);
        throw new api_error_1.ApiError(401, "Invalid session token");
    }
    await session_dao_1.sessionDao.revokeById(payload.sessionId);
    const nextAccessToken = (0, jwt_1.signAccessToken)({
        userId: payload.userId,
        email: user.email,
        name: user.name,
        verified: user.verified
    });
    const nextSessionId = new mongoose_1.Types.ObjectId().toString();
    const nextRefreshToken = (0, jwt_1.signRefreshToken)({ userId: payload.userId, sessionId: nextSessionId });
    await session_dao_1.sessionDao.createSession({
        sessionId: nextSessionId,
        userId: payload.userId,
        refreshTokenHash: (0, crypto_1.sha256)(nextRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userAgent: req.headers["user-agent"] ?? "unknown",
        ipAddress: req.ip ?? "unknown"
    });
    res.cookie(env_1.env.REFRESH_COOKIE_NAME, nextRefreshToken, cookieOptions());
    (0, api_response_1.ApiResponse)(res, 200, "Token refreshed", {
        accessToken: nextAccessToken,
        user: sanitizeUser({
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            verified: user.verified
        })
    });
});
exports.logout = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const incomingToken = req.cookies[env_1.env.REFRESH_COOKIE_NAME] ?? "";
    if (incomingToken) {
        try {
            const payload = (0, jwt_1.verifyRefreshToken)(incomingToken);
            await session_dao_1.sessionDao.revokeById(payload.sessionId);
        }
        catch {
            // Do not leak token verification details during logout.
        }
    }
    res.clearCookie(env_1.env.REFRESH_COOKIE_NAME, cookieOptions());
    (0, api_response_1.ApiResponse)(res, 200, "Logged out successfully");
});
exports.forgotPassword = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    const user = await user_dao_1.userDao.findByEmail(String(email));
    if (user) {
        const rawToken = (0, crypto_1.generateRandomToken)();
        await user_dao_1.userDao.setResetToken(user._id.toString(), (0, crypto_1.sha256)(rawToken), new Date(Date.now() + 15 * 60 * 1000));
        await (0, sendmail_1.sendmail)({
            to: user.email,
            subject: "Reset your password",
            text: `You requested to reset your password. Use this token: ${rawToken}`,
            html: `<p>You requested to reset your password. Use this token: <strong>${rawToken}</strong></p>`
        });
        (0, api_response_1.ApiResponse)(res, 200, "If the account exists, a reset link has been generated.", {
            resetToken: env_1.isProduction ? undefined : rawToken
        });
        return;
    }
    (0, api_response_1.ApiResponse)(res, 200, "If the account exists, a reset link has been generated.");
});
exports.resetPassword = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { token, newPassword } = req.body;
    const user = await user_dao_1.userDao.findByValidResetToken((0, crypto_1.sha256)(String(token)));
    if (!user) {
        throw new api_error_1.ApiError(400, "Invalid or expired reset token");
    }
    const nextPasswordHash = await (0, crypto_1.hashPassword)(String(newPassword));
    await user_dao_1.userDao.updatePassword(user._id.toString(), nextPasswordHash);
    await session_dao_1.sessionDao.revokeAllByUser(user._id.toString());
    (0, api_response_1.ApiResponse)(res, 200, "Password reset successfully");
});
exports.verifyEmail = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        throw new api_error_1.ApiError(400, "Email and OTP are required");
    }
    const user = await user_dao_1.userDao.findByEmail(email);
    if (!user) {
        throw new api_error_1.ApiError(404, "User not found");
    }
    if (user.verified) {
        throw new api_error_1.ApiError(400, "Email is already verified");
    }
    if (!user.verificationOtpHash ||
        !user.verificationOtpExpiresAt ||
        user.verificationOtpExpiresAt < new Date() ||
        user.verificationOtpHash !== (0, crypto_1.sha256)(String(otp))) {
        throw new api_error_1.ApiError(400, "Invalid or expired OTP");
    }
    const updatedUser = await user_dao_1.userDao.markEmailAsVerified(user._id.toString());
    if (!updatedUser) {
        throw new api_error_1.ApiError(500, "Failed to update email verification status");
    }
    // Issue new access token with verified: true
    const newAccessToken = (0, jwt_1.signAccessToken)({
        userId: updatedUser._id.toString(),
        email: updatedUser.email,
        name: updatedUser.name,
        verified: true
    });
    (0, api_response_1.ApiResponse)(res, 200, "Email verified successfully", {
        accessToken: newAccessToken,
        user: sanitizeUser({
            _id: updatedUser._id.toString(),
            name: updatedUser.name,
            email: updatedUser.email,
            verified: updatedUser.verified
        })
    });
});
exports.resendVerification = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new api_error_1.ApiError(400, "Email is required");
    }
    const user = await user_dao_1.userDao.findByEmail(String(email));
    if (!user) {
        (0, api_response_1.ApiResponse)(res, 200, "If the email is unregistered or unverified, a verification link has been resent.");
        return;
    }
    if (user.verified) {
        throw new api_error_1.ApiError(400, "Email is already verified");
    }
    const otp = generateOtp();
    await user_dao_1.userDao.setVerificationOtp(user._id.toString(), (0, crypto_1.sha256)(otp), new Date(Date.now() + 15 * 60 * 1000) // 15 minutes expiry
    );
    await (0, sendmail_1.sendmail)({
        to: user.email,
        subject: "Verify your email address",
        text: `Your email verification OTP is ${otp}. It will expire in 15 minutes.`,
        html: `<p>Your email verification OTP is <strong>${otp}</strong>. It will expire in 15 minutes.</p>`
    });
    (0, api_response_1.ApiResponse)(res, 200, "If the email is unregistered or unverified, a verification link has been resent.");
});
exports.logoutAll = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    if (!user) {
        throw new api_error_1.ApiError(401, "Unauthorized");
    }
    await session_dao_1.sessionDao.revokeAllByUser(user.userId);
    (0, api_response_1.ApiResponse)(res, 200, "Logged out from all sessions successfully");
});
exports.me = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const payload = req.user;
    if (!payload) {
        throw new api_error_1.ApiError(401, "Unauthorized");
    }
    const user = await user_dao_1.userDao.findById(payload.userId);
    if (!user) {
        throw new api_error_1.ApiError(404, "User not found");
    }
    (0, api_response_1.ApiResponse)(res, 200, "User details fetched successfully", {
        user: sanitizeUser({
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            verified: user.verified
        })
    });
});
