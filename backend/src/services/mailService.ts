import nodemailer, { type Transporter } from 'nodemailer';
import prisma from '../config/database';

/**
 * SMTP mail service.
 *
 * Configuration is stored in the `app_settings` table (editable from the
 * Administration → SMTP Settings UI). Environment variables act as fallbacks
 * when the DB has no values. If nothing is configured the service runs in
 * "dry-run" mode: emails are logged to the console instead of being sent.
 */

interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

const SMTP_KEYS = ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass', 'smtp_from'] as const;

export async function getSmtpConfig(): Promise<SmtpConfig> {
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: [...SMTP_KEYS] } },
  });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;

  return {
    host: map.smtp_host || process.env.SMTP_HOST || '',
    port: parseInt(map.smtp_port || process.env.SMTP_PORT || '587', 10),
    secure: (map.smtp_secure ?? process.env.SMTP_SECURE ?? 'false') === 'true',
    user: map.smtp_user ?? process.env.SMTP_USER ?? '',
    pass: map.smtp_pass ?? process.env.SMTP_PASS ?? '',
    from: map.smtp_from || process.env.SMTP_FROM || 'no-reply@urbanfurniture.local',
  };
}

export async function saveSmtpConfig(cfg: Partial<SmtpConfig>): Promise<void> {
  const entries: { key: string; value: string }[] = [];
  if (cfg.host !== undefined) entries.push({ key: 'smtp_host', value: cfg.host });
  if (cfg.port !== undefined) entries.push({ key: 'smtp_port', value: String(cfg.port) });
  if (cfg.secure !== undefined) entries.push({ key: 'smtp_secure', value: String(cfg.secure) });
  if (cfg.user !== undefined) entries.push({ key: 'smtp_user', value: cfg.user });
  if (cfg.pass !== undefined) entries.push({ key: 'smtp_pass', value: cfg.pass });
  if (cfg.from !== undefined) entries.push({ key: 'smtp_from', value: cfg.from });

  for (const e of entries) {
    await prisma.appSetting.upsert({
      where: { key: e.key },
      update: { value: e.value },
      create: { key: e.key, value: e.value },
    });
  }
}

let transporter: Transporter | null = null;
let transporterKey = '';

async function getTransporter(): Promise<Transporter | null> {
  const cfg = await getSmtpConfig();
  if (!cfg.host) return null;
  const key = `${cfg.host}:${cfg.port}:${cfg.user}:${cfg.pass}`;
  if (transporter && transporterKey === key) return transporter;
  transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
  });
  transporterKey = key;
  return transporter;
}

export async function sendMail(opts: MailOptions): Promise<boolean> {
  const cfg = await getSmtpConfig();
  const transport = await getTransporter();

  if (!transport) {
    console.log(
      `[MAIL DRY-RUN] to=${opts.to} subject="${opts.subject}"\n${opts.text ?? opts.html ?? ''}`,
    );
    return false;
  }

  try {
    await transport.sendMail({ from: cfg.from, to: opts.to, subject: opts.subject, text: opts.text, html: opts.html });
    return true;
  } catch (err) {
    console.error('[MAIL ERROR]', err);
    return false;
  }
}

export async function sendTestEmail(to: string): Promise<boolean> {
  return sendMail({
    to,
    subject: 'SMTP test — Urban Furniture',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px">
        <h2 style="color:#714B67;margin:0 0 12px">SMTP settings work!</h2>
        <p>This is a test email from the Urban Furniture Accounting System.</p>
        <p>Your SMTP configuration is correctly set up.</p>
        <p style="color:#8F8F8F;font-size:12px;margin-top:24px">Urban Furniture Accounting System</p>
      </div>`,
  });
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