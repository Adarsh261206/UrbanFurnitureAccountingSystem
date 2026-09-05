import { Request, Response, NextFunction } from 'express';
import { getSmtpConfig, saveSmtpConfig, sendTestEmail } from '../services/mailService';
import { AppError } from '../utils/errors';

export async function getSmtpSettings(_req: Request, res: Response, next: NextFunction) {
  try {
    const cfg = await getSmtpConfig();
    res.json({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      user: cfg.user,
      has_pass: Boolean(cfg.pass),
      pass: cfg.pass || '',
      from: cfg.from,
    });
  } catch (err) { next(err); }
}

export async function updateSmtpSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const host = req.body.host !== undefined ? String(req.body.host).trim() : undefined;
    const port = req.body.port !== undefined ? parseInt(req.body.port, 10) : undefined;
    const secure = req.body.secure !== undefined ? Boolean(req.body.secure) : undefined;
    const user = req.body.user !== undefined ? String(req.body.user).trim() : undefined;
    const pass = req.body.pass !== undefined ? String(req.body.pass) : undefined;
    const from = req.body.from !== undefined ? String(req.body.from).trim() : undefined;

    if (port !== undefined && (Number.isNaN(port) || port <= 0 || port > 65535)) {
      throw new AppError('VALIDATION', 'Port must be between 1 and 65535', 400, 'port');
    }

    await saveSmtpConfig({ host, port, secure, user, pass, from });
    const cfg = await getSmtpConfig();
    res.json({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      user: cfg.user,
      has_pass: Boolean(cfg.pass),
      pass: cfg.pass || '',
      from: cfg.from,
    });
  } catch (err) { next(err); }
}

export async function testSmtpSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const to = req.body.to;
    if (!to || typeof to !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      throw new AppError('VALIDATION', 'A valid recipient email is required', 400, 'to');
    }
    const sent = await sendTestEmail(to);
    if (sent) {
      res.json({ message: `Test email sent to ${to}` });
    } else {
      res.json({
        message: 'SMTP not configured — email was logged to the server console (dry-run).',
        dry_run: true,
      });
    }
  } catch (err) { next(err); }
}