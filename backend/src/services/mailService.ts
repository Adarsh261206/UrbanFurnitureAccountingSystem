import nodemailer, { type Transporter } from 'nodemailer';

/**
 * SMTP mail service.
 *
 * If SMTP_HOST is not configured the service runs in "dry-run" mode:
 * emails are logged to the console instead of being sent (dev-friendly).
 */

interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: (process.env.SMTP_SECURE || 'false') === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
        : undefined,
    });
  }
  return transporter;
}

export async function sendMail(opts: MailOptions): Promise<boolean> {
  const transport = getTransporter();
  const from = process.env.SMTP_FROM || 'no-reply@urbanfurniture.local';

  if (!transport) {
    console.log(
      `[MAIL DRY-RUN] to=${opts.to} subject="${opts.subject}"\n${opts.text ?? opts.html ?? ''}`,
    );
    return false;
  }

  try {
    await transport.sendMail({ from, to: opts.to, subject: opts.subject, text: opts.text, html: opts.html });
    return true;
  } catch (err) {
    console.error('[MAIL ERROR]', err);
    return false;
  }
}

export function appUrl(): string {
  return process.env.APP_URL || 'http://localhost:5173';
}

export async function sendApprovalEmail(email: string, name: string | null): Promise<boolean> {
  return sendMail({
    to: email,
    subject: 'Your account has been approved',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px">
        <h2 style="color:#714B67;margin:0 0 12px">Welcome to Urban Furniture!</h2>
        <p>Hi ${name ?? 'there'},</p>
        <p>Your account has been <strong>approved</strong> by the administrator.</p>
        <p>You can now sign in at:</p>
        <p><a href="${appUrl()}/login" style="background:#714B67;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">Sign in</a></p>
        <p style="color:#8F8F8F;font-size:12px;margin-top:24px">Urban Furniture Accounting System</p>
      </div>`,
  });
}

export async function sendRejectionEmail(email: string, name: string | null): Promise<boolean> {
  return sendMail({
    to: email,
    subject: 'Your account request was not approved',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px">
        <h2 style="color:#714B67;margin:0 0 12px">Urban Furniture</h2>
        <p>Hi ${name ?? 'there'},</p>
        <p>Unfortunately your account request was <strong>not approved</strong> by the administrator.</p>
        <p>If you believe this is a mistake, please contact the administrator.</p>
        <p style="color:#8F8F8F;font-size:12px;margin-top:24px">Urban Furniture Accounting System</p>
      </div>`,
  });
}

export async function sendResetPasswordEmail(email: string, name: string | null, resetUrl: string): Promise<boolean> {
  return sendMail({
    to: email,
    subject: 'Reset your password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px">
        <h2 style="color:#714B67;margin:0 0 12px">Reset your password</h2>
        <p>Hi ${name ?? 'there'},</p>
        <p>We received a request to reset your password. Click the link below to choose a new one (valid for 1 hour):</p>
        <p><a href="${resetUrl}" style="background:#714B67;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">Reset password</a></p>
        <p style="color:#8F8F8F;font-size:12px;margin-top:24px">If you did not request this, you can safely ignore this email.</p>
      </div>`,
  });
}