"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_validation_1 = require("../validations/auth.validation");
const validate_request_1 = require("../validations/validate-request");
const auth_user_middleware_1 = require("../middlewares/auth-user.middleware");
const authRouter = (0, express_1.Router)();
exports.authRouter = authRouter;
/**
 * POST /api/v1/auth/register
 */
authRouter.post("/register", auth_validation_1.registerValidation, validate_request_1.validateRequest, auth_controller_1.register);
authRouter.post("/login", auth_validation_1.loginValidation, validate_request_1.validateRequest, auth_controller_1.login);
authRouter.post("/refresh", auth_controller_1.refresh);
authRouter.post("/logout", auth_controller_1.logout);
authRouter.post("/forgot-password", auth_validation_1.forgotPasswordValidation, validate_request_1.validateRequest, auth_controller_1.forgotPassword);
authRouter.post("/reset-password", auth_validation_1.resetPasswordValidation, validate_request_1.validateRequest, auth_controller_1.resetPassword);
authRouter.post("/verify-email", auth_validation_1.verifyEmailValidation, validate_request_1.validateRequest, auth_controller_1.verifyEmail);
authRouter.post("/resend-verification", auth_validation_1.resendVerificationValidation, validate_request_1.validateRequest, auth_controller_1.resendVerification);
authRouter.get("/me", auth_user_middleware_1.authUserMiddleware, auth_controller_1.me);
authRouter.post("/logout-all", auth_user_middleware_1.authUserMiddleware, auth_controller_1.logoutAll);
authRouter.post("/logout/all", auth_user_middleware_1.authUserMiddleware, auth_controller_1.logoutAll); // Alias
