"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    resetPasswordTokenHash: {
        type: String,
        default: null
    },
    resetPasswordExpiresAt: {
        type: Date,
        default: null
    },
    verified: {
        type: Boolean,
        default: false
    },
    verificationOtpHash: {
        type: String,
        default: null
    },
    verificationOtpExpiresAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });
exports.UserModel = (0, mongoose_1.model)("User", userSchema);
