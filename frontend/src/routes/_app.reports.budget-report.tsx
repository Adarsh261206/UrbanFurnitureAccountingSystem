import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { RequireRole } from "@/components/guards/RouteGuards";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { ViewToggle, type ViewMode } from "@/components/common/ViewToggle";
import { reportsService } from "@/services/reportsService";
import { money, percent, date } from "@/lib/format";
import { ReportHeader, YearSelect } from "@/components/reports/ReportLayout";
import type { BudgetType } from "@/types/api";

export const Route = createFileRoute("/_app/reports/budget-report")({
  head: () => ({
    meta: [
      { title: "Budget report — Urban Furniture Accounting" },
      { name: "description", content: "Budget report in the Urban Furniture Accounting System." },
      { property: "og:title", content: "Budget report — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "Budget report in the Urban Furniture Accounting System.",
      },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin", "accountant"]}>
      <Page />
    </RequireRole>
  ),
});

const currentYear = new Date().getFullYear();

function Page() {
  const [year, setYear] = useState(currentYear);
  const [type, setType] = useState<BudgetType | "">("");
  const [view, setView] = useState<ViewMode>("list");

  const query = useQuery({
    queryKey: ["reports", "budget-report", year, type],
    queryFn: () => reportsService.budgetReport({ year, ...(type ? { type } : {}) }),
  });

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Budget Report"
        subtitle={`Committed vs. achieved amounts for ${year}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Type</span>
              <select
                aria-label="Budget type"
                value={type}
                onChange={(e) => setType(e.target.value as BudgetType | "")}
                className="h-9 rounded-md border border-input bg-card px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
              >
                <option value="">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </label>
            <YearSelect value={year} onChange={setYear} />
          </div>
        }
      />

      <div className="flex justify-end">
        <ViewToggle value={view} onChange={setView} label="Budget report view mode" />
      </div>

      {query.isLoading ? <LoadingState label="Loading report" /> : null}
      {query.isError ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : null}

      {!query.isLoading && !query.isError && (!query.data || query.data.budgets.length === 0) ? (
        <EmptyState
          title="No budgets found"
          description="No budgets match the selected year and type."
        />
      ) : null}

      {query.data && query.data.budgets.length > 0 ? (
        <BudgetPieCharts budgets={query.data.budgets} />
      ) : null}

      {query.data && query.data.budgets.length > 0 && view === "kanban" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { title: "Achieved", field: "achieved_amount" as const },
            { title: "Committed", field: "committed_amount" as const },
            { title: "Budget", field: "amount_to_achieve" as const },
          ].map((section) => (
            <section key={section.title} className="rounded-lg border bg-card p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-foreground">{section.title}</h2>
              <ul className="space-y-3">
                {query.data.budgets.map((b) => (
                  <li key={b.id} className="rounded-md border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">{b.name}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {date(b.start_date)} – {date(b.end_date)} · {b.type}
                    </p>
                    <p className="mt-2 text-lg font-semibold tabular-nums text-foreground">
                      {money(b[section.field])}
                    </p>
                    {section.title === "Achieved" ? (
                      <div className="mt-2 flex items-center gap-2">
                        <Progress
                          value={Math.min(100, Math.max(0, b.achieved_percentage))}
                          className="h-2 w-24"
                        />
                        <span className="text-xs text-muted-foreground">
                          {percent(b.achieved_percentage)}
                        </span>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}

      {query.data && query.data.budgets.length > 0 && view === "list" ? (
        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                    Name
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                    Period
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                    Type
                  </th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                    Committed
                  </th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                    Achieved
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                    Progress
                  </th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                    To achieve
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {query.data.budgets.map((b) => (
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="px-4 py-2.5 font-medium text-foreground">{b.name}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-[13px]">
                      {date(b.start_date)} – {date(b.end_date)}
                    </td>
                    <td className="px-4 py-2.5 text-[13px] capitalize">{b.type}</td>
                    <td className="px-4 py-2.5 text-right text-[13px] tabular-nums">
                      {money(b.committed_amount)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[13px] tabular-nums">
                      {money(b.achieved_amount)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={Math.min(100, Math.max(0, b.achieved_percentage))}
                          className="h-2 w-24"
                        />
                        <span className="text-xs text-muted-foreground">
                          {percent(b.achieved_percentage)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-[13px] tabular-nums">
                      {money(b.amount_to_achieve)}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const PIE_COLORS = ["#714B67", "#017E84", "#8F8F8F", "#D97B6C", "#C9A24B", "#7A9E7E"];

function BudgetPieCharts({
  budgets,
}: {
  budgets: {
    name: string;
    type: BudgetType;
    committed_amount: number;
    achieved_amount: number;
    status: string;
  }[];
}) {
  const byType = ["income", "expense"]
    .map((t) => ({
      name: t === "income" ? "Income" : "Expense",
      value: budgets.filter((b) => b.type === t).reduce((s, b) => s + (b.committed_amount ?? 0), 0),
    }))
    .filter((d) => d.value > 0);

  const byStatus = ["draft", "confirmed", "revised", "cancelled"]
    .map((s, i) => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      value: budgets.filter((b) => b.status === s).length,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }))
    .filter((d) => d.value > 0);

  const byName = budgets
    .map((b, i) => ({
      name: b.name,
      value: b.committed_amount ?? 0,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }))
    .filter((d) => d.value > 0)
    .slice(0, 6);

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(v);

  return (
    <section aria-label="Budget charts" className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Income vs Expense</h2>
        <p className="mb-2 text-xs text-muted-foreground">Committed amounts by type</p>
        {byType.length > 0 ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byType}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={3}
                  strokeWidth={2}
                >
                  {byType.map((d, i) => (
                    <Cell key={d.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => fmt(Number(v ?? 0))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">No committed budgets</p>
        )}
      </div>

      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Budget Status</h2>
        <p className="mb-2 text-xs text-muted-foreground">Count by status</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={byStatus}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={80}
                paddingAngle={3}
                strokeWidth={2}
              >
                {byStatus.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Top Budgets by Amount</h2>
        <p className="mb-2 text-xs text-muted-foreground">Largest committed budgets</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={byName} dataKey="value" nameKey="name" outerRadius={80} strokeWidth={2}>
                {byName.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => fmt(Number(v ?? 0))} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
