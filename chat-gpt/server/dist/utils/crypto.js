"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
exports.generateRandomToken = generateRandomToken;
exports.sha256 = sha256;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = require("crypto");
const SALT_ROUNDS = 12;
function hashPassword(value) {
    return bcryptjs_1.default.hash(value, SALT_ROUNDS);
}
function comparePassword(value, hash) {
    return bcryptjs_1.default.compare(value, hash);
}
function generateRandomToken(size = 32) {
    return (0, crypto_1.randomBytes)(size).toString("hex");
}
function sha256(value) {
    return (0, crypto_1.createHash)("sha256").update(value).digest("hex");
}
