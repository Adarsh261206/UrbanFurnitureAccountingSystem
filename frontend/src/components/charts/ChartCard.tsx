import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Card wrapper for chart sections with consistent chrome. */
export function ChartCard({
  title,
  subtitle,
  children,
  className,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={cn("rounded-lg border bg-card p-5 shadow-sm", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export const CHART_COLORS = {
  revenue: "#714B67",
  expense: "#F59E0B",
  inflow: "#017E84",
  outflow: "#EF4444",
  draft: "#94A3B8",
  confirmed: "#017E84",
  paid: "#10B981",
};
