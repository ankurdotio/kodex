import { Router } from "express";
import {
  forgotPassword,
  login,
  logout,
  refresh,
  register,
  resetPassword,
  verifyEmail,
  resendVerification,
  logoutAll,
  me
} from "../controllers/auth.controller";
import {
  forgotPasswordValidation,
  loginValidation,
  registerValidation,
  resetPasswordValidation,
  verifyEmailValidation,
  resendVerificationValidation
} from "../validations/auth.validation";
import { validateRequest } from "../validations/validate-request";
import { authUserMiddleware } from "../middlewares/auth-user.middleware";

const authRouter = Router();

/**
 * POST /api/v1/auth/register
 */
authRouter.post(
  "/register",
  registerValidation,
  validateRequest,
  register
);

authRouter.post(
  "/login",
  loginValidation,
  validateRequest,
  login
);

authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);

authRouter.post(
  "/forgot-password",
  forgotPasswordValidation,
  validateRequest,
  forgotPassword
);

authRouter.post(
  "/reset-password",
  resetPasswordValidation,
  validateRequest,
  resetPassword
);

authRouter.post(
  "/verify-email",
  verifyEmailValidation,
  validateRequest,
  verifyEmail
);

authRouter.post(
  "/resend-verification",
  resendVerificationValidation,
  validateRequest,
  resendVerification
);

authRouter.get("/me", authUserMiddleware, me);

authRouter.post("/logout-all", authUserMiddleware, logoutAll);
authRouter.post("/logout/all", authUserMiddleware, logoutAll); // Alias

export { authRouter };
