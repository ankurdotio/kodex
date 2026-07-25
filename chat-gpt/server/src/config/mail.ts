import { BrevoClient } from "@getbrevo/brevo";
import nodemailer from "nodemailer";
import env from "./env.js";

/**
 * Brevo HTTP API client — used when BREVO_API_KEY is set.
 * Sends over HTTPS (port 443), never blocked by cloud providers.
 * Falls back to nodemailer SMTP transporter if no API key is provided.
 */

export const brevoClient = env.BREVO_API_KEY
    ? new BrevoClient({ apiKey: env.BREVO_API_KEY })
    : null;

export const smtpTransporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});