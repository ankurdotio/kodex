import { env } from "../config/env";
import logger from "../config/logger";
import { brevoClient, smtpTransporter } from "../config/mail";

export interface MailOptions {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}

/**
 * Sends an email using:
 * - Brevo HTTP API if BREVO_API_KEY is set (works on all cloud hosts, no SMTP port blocks)
 * - SMTP transporter as fallback (requires outbound SMTP ports to be open)
 * - If SEND_MAIL is false, logs the email details to the terminal instead
 */
export async function sendmail(options: MailOptions): Promise<void> {
  const toList = Array.isArray(options.to) ? options.to : [options.to];

  if (!env.SEND_MAIL) {
    logger.info(
      {
        from: env.MAIL_FROM,
        to: options.to,
        subject: options.subject,
        text: options.text,
      },
      "SEND_MAIL is false. Logged email details."
    );
    return;
  }

  // Use Brevo HTTP API if API key is configured (recommended for cloud deployments)
  if (brevoClient) {
    try {
      const result = await brevoClient.transactionalEmails.sendTransacEmail({
        sender: { name: "CHAD-GPT", email: env.MAIL_FROM },
        to: toList.map((email) => ({ email })),
        subject: options.subject,
        textContent: options.text,
        ...(options.html ? { htmlContent: options.html } : {}),
      });
      logger.info({ messageId: (result as any).messageId ?? "sent" }, "Email sent via Brevo HTTP API");
    } catch (error) {
      logger.error({ err: error }, "Failed to send email via Brevo HTTP API");
      throw error;
    }
    return;
  }

  // Fallback to SMTP transporter
  try {
    const info = await smtpTransporter.sendMail({
      from: `CHAD-GPT <${env.MAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    logger.info({ messageId: info.messageId }, "Email sent via SMTP");
  } catch (error) {
    logger.error({ err: error }, "Failed to send email via SMTP");
    throw error;
  }
}
