import nodemailer from "nodemailer";
import { logger } from "../config/logger";

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

const sendEmail = async (options: EmailOptions): Promise<void> => {
  // If no SMTP settings are provided, we can log the email in development
  if (
    !process.env.EMAIL_HOST ||
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASS
  ) {
    logger.warn("⚠️ SMTP settings not found. Email not sent.");
    logger.info(`📧 EMAIL SIMULATION:
      To: ${options.email}
      Subject: ${options.subject}
      Message: ${options.message}
    `);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const message = {
    from: `${process.env.EMAIL_FROM_NAME || "Interview Trainer AI"} <${
      process.env.EMAIL_FROM || "noreply@interviewtrainer.ai"
    }>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  const info = await transporter.sendMail(message);

  logger.info("Message sent: %s", info.messageId);
};

export default sendEmail;
