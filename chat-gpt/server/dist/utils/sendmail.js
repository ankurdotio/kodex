"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendmail = sendmail;
const env_1 = require("../config/env");
const logger_1 = __importDefault(require("../config/logger"));
const mail_1 = require("../config/mail");
/**
 * Sends an email using:
 * - Brevo HTTP API if BREVO_API_KEY is set (works on all cloud hosts, no SMTP port blocks)
 * - SMTP transporter as fallback (requires outbound SMTP ports to be open)
 * - If SEND_MAIL is false, logs the email details to the terminal instead
 */
async function sendmail(options) {
    const toList = Array.isArray(options.to) ? options.to : [options.to];
    if (!env_1.env.SEND_MAIL) {
        logger_1.default.info({
            from: env_1.env.MAIL_FROM,
            to: options.to,
            subject: options.subject,
            text: options.text,
        }, "SEND_MAIL is false. Logged email details.");
        return;
    }
    // Use Brevo HTTP API if API key is configured (recommended for cloud deployments)
    if (mail_1.brevoClient) {
        try {
            const result = await mail_1.brevoClient.transactionalEmails.sendTransacEmail({
                sender: { name: "CHAD-GPT", email: env_1.env.MAIL_FROM },
                to: toList.map((email) => ({ email })),
                subject: options.subject,
                textContent: options.text,
                ...(options.html ? { htmlContent: options.html } : {}),
            });
            logger_1.default.info({ messageId: result.messageId ?? "sent" }, "Email sent via Brevo HTTP API");
        }
        catch (error) {
            logger_1.default.error({ err: error }, "Failed to send email via Brevo HTTP API");
            throw error;
        }
        return;
    }
    // Fallback to SMTP transporter
    try {
        const info = await mail_1.smtpTransporter.sendMail({
            from: `CHAD-GPT <${env_1.env.MAIL_FROM}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        });
        logger_1.default.info({ messageId: info.messageId }, "Email sent via SMTP");
    }
    catch (error) {
        logger_1.default.error({ err: error }, "Failed to send email via SMTP");
        throw error;
    }
}
