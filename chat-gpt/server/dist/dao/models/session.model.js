"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionModel = void 0;
const mongoose_1 = require("mongoose");
const sessionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    refreshTokenHash: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        default: "unknown"
    },
    ipAddress: {
        type: String,
        default: "unknown"
    },
    isRevoked: {
        type: Boolean,
        default: false,
        index: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true
    },
    lastUsedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });
exports.SessionModel = (0, mongoose_1.model)("Session", sessionSchema);
