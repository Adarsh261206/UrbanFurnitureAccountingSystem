import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, EmptyState, ErrorState } from "@/components/common/States";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { ViewToggle, type ViewMode } from "@/components/common/ViewToggle";
import { reportsService } from "@/services/reportsService";
import { money, percent, date } from "@/lib/format";
import type { BudgetType } from "@/types/api";

export const Route = createFileRoute("/_app/reports/budget-report")({
  head: () => ({
    meta: [
      { title: "Budget report — Urban Furniture Accounting" },
      { name: "description", content: "Budget report in the Urban Furniture Accounting System." },
      { property: "og:title", content: "Budget report — Urban Furniture Accounting" },
      { property: "og:description", content: "Budget report in the Urban Furniture Accounting System." },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin", "accountant"]}>
      <Page />
    </RequireRole>
  ),
});

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - i);

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
      <PageHeader
        title="Budget report"
        description="Committed vs. achieved amounts by budget."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as BudgetType | "")}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        }
      />


      <div className="flex justify-end">
        <ViewToggle value={view} onChange={setView} label="Budget report view mode" />
      </div>

      {query.isLoading ? (
        <LoadingState label="Loading report" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : !query.data || query.data.budgets.length === 0 ? (
        <EmptyState title="No budgets found" description="No budgets match the selected year and type." />
      ) : view === "kanban" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {(
            [
              { title: "Achieved", field: "achieved_amount" as const },
              { title: "Committed", field: "committed_amount" as const },
              { title: "Budget", field: "amount_to_achieve" as const },
            ]
          ).map((section) => (
            <section key={section.title} className="rounded-lg border border-border bg-card p-4">
              <h2 className="mb-3 text-sm font-semibold text-foreground">{section.title}</h2>
              <ul className="space-y-3">
                {query.data.budgets.map((b) => (
                  <li key={b.id} className="rounded-md border border-border p-3">
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
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Period</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-right">Committed</th>
                <th className="px-4 py-3 text-right">Achieved</th>
                <th className="px-4 py-3 text-left">Progress</th>
                <th className="px-4 py-3 text-right">To achieve</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {query.data.budgets.map((b) => (
                <tr key={b.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {date(b.start_date)} – {date(b.end_date)}
                  </td>
                  <td className="px-4 py-3 capitalize">{b.type}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{money(b.committed_amount)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{money(b.achieved_amount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Progress value={Math.min(100, Math.max(0, b.achieved_percentage))} className="h-2 w-24" />
                      <span className="text-xs text-muted-foreground">{percent(b.achieved_percentage)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{money(b.amount_to_achieve)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
