import { http } from "@/lib/api/client";

export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  has_pass: boolean;
  pass: string;
  from: string;
}

/** Administration — SMTP mail configuration. */
export const settingsService = {
  getSmtp: () => http.get<SmtpSettings>("/settings/smtp"),
  updateSmtp: (body: Partial<SmtpSettings>) => http.put<SmtpSettings>("/settings/smtp", body),
  testSmtp: (to: string) =>
    http.post<{ message: string; dry_run?: boolean }>("/settings/smtp/test", { to }),
};
