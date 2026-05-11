import { Resend } from "resend";

/**
 * Returns a configured Resend client, or null if env vars aren't set
 * yet. Callers should fail-soft when null — sending an email is
 * best-effort and shouldn't take down the surrounding flow.
 */
export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export function getFromAddress(): string {
  return process.env.MOIDELLO_EMAIL_FROM ?? "Moidello <hello@moidello.com>";
}

export interface EmailResult {
  ok: boolean;
  error?: string;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<EmailResult> {
  const resend = getResend();
  if (!resend) {
    return {
      ok: false,
      error:
        "RESEND_API_KEY missing — set it in Vercel env to enable outgoing email.",
    };
  }
  try {
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Okänt fel.",
    };
  }
}
