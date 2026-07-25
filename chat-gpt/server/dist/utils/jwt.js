"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = __importDefault(require("../config/env.js"));
const accessTokenOptions = {
    expiresIn: env_js_1.default.ACCESS_TOKEN_TTL
};
const refreshTokenOptions = {
    expiresIn: env_js_1.default.REFRESH_TOKEN_TTL
};
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign({ ...payload, type: "access" }, env_js_1.default.JWT_ACCESS_SECRET, accessTokenOptions);
}
function signRefreshToken(payload) {
    return jsonwebtoken_1.default.sign({ ...payload, type: "refresh" }, env_js_1.default.JWT_REFRESH_SECRET, refreshTokenOptions);
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, env_js_1.default.JWT_ACCESS_SECRET);
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, env_js_1.default.JWT_REFRESH_SECRET);
}
