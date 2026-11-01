import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = process.env.EMAIL_FROM || "RAUDEV <onboarding@resend.dev>";

type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export async function sendEmail(message: EmailMessage) {
  // Without an API key (local dev), print the email instead of sending it
  if (!resend) {
    console.log(`[EMAIL] To: ${message.to} | Subject: ${message.subject}\n${message.text}`);
    return;
  }

  const { error } = await resend.emails.send({ from, ...message });
  if (error) {
    throw new Error(`Failed to send email to ${message.to}: ${error.message}`);
  }
}
