import { body } from "express-validator";

export const registerValidation = [
  body("name").isString().isLength({ min: 2 }).withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
];

export const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isString().notEmpty().withMessage("Password is required")
];

export const forgotPasswordValidation = [
  body("email").isEmail().withMessage("Valid email is required")
];

export const resetPasswordValidation = [
  body("token").isString().notEmpty().withMessage("Token is required"),
  body("newPassword")
    .isString()
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters")
];

export const verifyEmailValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("otp").isString().isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits")
];

export const resendVerificationValidation = [
  body("email").isEmail().withMessage("Valid email is required")
];
