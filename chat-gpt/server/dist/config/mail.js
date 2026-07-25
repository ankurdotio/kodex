"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.smtpTransporter = exports.brevoClient = void 0;
const brevo_1 = require("@getbrevo/brevo");
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_js_1 = __importDefault(require("./env.js"));
/**
 * Brevo HTTP API client — used when BREVO_API_KEY is set.
 * Sends over HTTPS (port 443), never blocked by cloud providers.
 * Falls back to nodemailer SMTP transporter if no API key is provided.
 */
exports.brevoClient = env_js_1.default.BREVO_API_KEY
    ? new brevo_1.BrevoClient({ apiKey: env_js_1.default.BREVO_API_KEY })
    : null;
exports.smtpTransporter = nodemailer_1.default.createTransport({
    host: env_js_1.default.SMTP_HOST,
    port: env_js_1.default.SMTP_PORT,
    auth: {
        user: env_js_1.default.SMTP_USER,
        pass: env_js_1.default.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});
