import type { ReactNode } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { money } from "@/lib/format";

export function ReportHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-lg border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
          Financial report
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle ? <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    </div>
  );
}

export function YearSelect({
  value,
  onChange,
  label = "Financial year",
}: {
  value: number;
  onChange: (year: number) => void;
  label?: string;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);
  return (
    <label className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9 rounded-md border border-input bg-card px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FinancialStatementTable({
  title,
  items,
  total,
}: {
  title: string;
  items: { account_name: string; amount: number }[];
  total: number;
}) {
  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <header className="border-b bg-muted/40 px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                Account
              </th>
              <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-5 py-8 text-center text-[13px] text-muted-foreground">
                  No {title.toLowerCase()} recorded for this year.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={`${item.account_name}-${index}`} className="border-b last:border-0">
                  <td className="px-5 py-2.5 text-[13px] text-foreground">{item.account_name}</td>
                  <td className="px-5 py-2.5 text-right text-[13px] tabular-nums text-foreground">
                    {money(item.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/40">
              <td className="px-5 py-3 text-[13px] font-semibold text-foreground">Total {title}</td>
              <td className="px-5 py-3 text-right text-[13px] font-bold tabular-nums text-foreground">
                {money(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

export function BalanceCheck({ balanced }: { balanced: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border px-5 py-4",
        balanced
          ? "border-success/25 bg-success/[0.04]"
          : "border-destructive/25 bg-destructive/[0.04]",
      )}
    >
      <span className="text-sm font-semibold text-foreground">Balance check</span>
      <span
        className={cn(
          "flex items-center gap-2 text-[15px] font-bold",
          balanced ? "text-success" : "text-destructive",
        )}
      >
        {balanced ? (
          <>
            <CheckCircle2 className="size-5" aria-hidden /> Balanced
          </>
        ) : (
          <>
            <XCircle className="size-5" aria-hidden /> Not balanced
          </>
        )}
      </span>
    </div>
  );
}
