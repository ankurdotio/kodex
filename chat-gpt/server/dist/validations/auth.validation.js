"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendVerificationValidation = exports.verifyEmailValidation = exports.resetPasswordValidation = exports.forgotPasswordValidation = exports.loginValidation = exports.registerValidation = void 0;
const express_validator_1 = require("express-validator");
exports.registerValidation = [
    (0, express_validator_1.body)("name").isString().isLength({ min: 2 }).withMessage("Name is required"),
    (0, express_validator_1.body)("email").isEmail().withMessage("Valid email is required"),
    (0, express_validator_1.body)("password")
        .isString()
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters")
];
exports.loginValidation = [
    (0, express_validator_1.body)("email").isEmail().withMessage("Valid email is required"),
    (0, express_validator_1.body)("password").isString().notEmpty().withMessage("Password is required")
];
exports.forgotPasswordValidation = [
    (0, express_validator_1.body)("email").isEmail().withMessage("Valid email is required")
];
exports.resetPasswordValidation = [
    (0, express_validator_1.body)("token").isString().notEmpty().withMessage("Token is required"),
    (0, express_validator_1.body)("newPassword")
        .isString()
        .isLength({ min: 8 })
        .withMessage("New password must be at least 8 characters")
];
exports.verifyEmailValidation = [
    (0, express_validator_1.body)("email").isEmail().withMessage("Valid email is required"),
    (0, express_validator_1.body)("otp").isString().isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits")
];
exports.resendVerificationValidation = [
    (0, express_validator_1.body)("email").isEmail().withMessage("Valid email is required")
];
