import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_COLORS } from "./ChartCard";

const STATUS_COLORS: Record<string, string> = {
  Draft: CHART_COLORS.draft,
  Confirmed: CHART_COLORS.confirmed,
  Paid: CHART_COLORS.paid,
};

export function InvoiceStatusChart({ data }: { data: { status: string; count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const safeData = data.filter((d) => d.count > 0);

  return (
    <div className="flex h-72 items-center gap-4">
      <div className="relative h-52 w-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={safeData}
              dataKey="count"
              nameKey="status"
              innerRadius={62}
              outerRadius={96}
              paddingAngle={3}
              strokeWidth={2}
            >
              {safeData.map((entry) => (
                <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#94A3B8"} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [
                `${value ?? 0} invoice${Number(value ?? 0) === 1 ? "" : "s"}`,
                "Count",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums text-foreground">{total}</span>
          <span className="text-xs text-muted-foreground">Invoices</span>
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-2.5">
        {safeData.map((d) => (
          <div key={d.status} className="flex items-center gap-2.5 text-[13px]">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[d.status] ?? "#94A3B8" }}
              aria-hidden
            />
            <span className="text-muted-foreground">{d.status}</span>
            <span className="ml-auto font-semibold tabular-nums text-foreground">{d.count}</span>
            <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
              {total > 0 ? Math.round((d.count / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
