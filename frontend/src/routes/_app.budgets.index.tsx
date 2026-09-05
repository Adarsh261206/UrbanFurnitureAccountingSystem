import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Plus } from "lucide-react";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { DataTable, TablePagination, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { KanbanCard, KanbanGrid, ViewToggle, type ViewMode } from "@/components/common/ViewToggle";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { budgetsService } from "@/services/budgetsService";
import { date as fmtDate, money, percent } from "@/lib/format";
import type { BudgetListRow } from "@/types/api";

export const Route = createFileRoute("/_app/budgets/")({
  head: () => ({
    meta: [
      { title: "Budgets — Urban Furniture Accounting" },
      { name: "description", content: "Budgets in the Urban Furniture Accounting System." },
      { property: "og:title", content: "Budgets — Urban Furniture Accounting" },
      { property: "og:description", content: "Budgets in the Urban Furniture Accounting System." },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin", "accountant"]}>
      <Page />
    </RequireRole>
  ),
});

const LIMIT = 20;

function responsibleName(r: BudgetListRow["responsible"]): string {
  if (!r) return "—";
  if (typeof r === "string") return r;
  return (r as { name?: string }).name ?? "—";
}

function Page() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState<ViewMode>("list");

  const query = useQuery({
    queryKey: ["budgets", page, type, status],
    queryFn: () =>
      budgetsService.list({
        page,
        limit: LIMIT,
        type: type !== "all" ? type : undefined,
        status: status !== "all" ? status : undefined,
      }),
  });

  // Charts need the full set (not just the current page) so the
  // distribution is correct regardless of pagination.
  const chartsQuery = useQuery({
    queryKey: ["budgets", "charts", type, status],
    queryFn: () =>
      budgetsService.list({
        page: 1,
        limit: 500,
        type: type !== "all" ? type : undefined,
        status: status !== "all" ? status : undefined,
      }),
  });

  const columns: Column<BudgetListRow>[] = [
    {
      key: "name",
      header: "Name",
      cell: (r) => <span className="font-medium text-foreground">{r.name}</span>,
    },
    { key: "responsible", header: "Responsible", cell: (r) => responsibleName(r.responsible) },
    { key: "type", header: "Type", cell: (r) => <span className="capitalize">{r.type}</span> },
    { key: "start_date", header: "Start", cell: (r) => fmtDate(r.start_date) },
    { key: "end_date", header: "End", cell: (r) => fmtDate(r.end_date) },
    {
      key: "committed_amount",
      header: "Committed",
      cell: (r) => money(r.committed_amount),
      align: "right",
    },
    {
      key: "achieved_amount",
      header: "Achieved",
      cell: (r) => money(r.achieved_amount),
      align: "right",
    },
    {
      key: "achieved_percentage",
      header: "Achieved %",
      cell: (r) => percent(r.achieved_percentage),
      align: "right",
    },
    {
      key: "amount_to_achieve",
      header: "To achieve",
      cell: (r) => money(r.amount_to_achieve),
      align: "right",
    },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets"
        crumbs={[{ label: "Master Settings" }, { label: "Analytical Budget" }]}
        description="Track committed and achieved amounts against analytic accounts."
        actions={
          <Button onClick={() => navigate({ to: "/budgets/new" })}>
            <Plus className="size-4" /> New budget
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="w-40 space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Type</span>
          <Select
            value={type}
            onValueChange={(v) => {
              setType(v);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-40 space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Status</span>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="revised">Revised</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto self-end">
          <ViewToggle value={view} onChange={setView} label="Budgets view mode" />
        </div>
      </div>

      {chartsQuery.data && chartsQuery.data.budgets.length > 0 ? (
        <BudgetPieCharts budgets={chartsQuery.data.budgets} />
      ) : null}

      {query.isLoading ? (
        <LoadingState label="Loading budgets" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data && query.data.budgets.length > 0 ? (
        <div className="space-y-4">
          {view === "list" ? (
            <DataTable
              columns={columns}
              rows={query.data.budgets}
              rowKey={(r) => r.id}
              onRowClick={(r) => navigate({ to: "/budgets/$id", params: { id: r.id } })}
              caption="Budgets"
            />
          ) : (
            <KanbanGrid>
              {query.data.budgets.map((b) => (
                <KanbanCard
                  key={b.id}
                  ariaLabel={`Open budget ${b.name}`}
                  onClick={() => navigate({ to: "/budgets/$id", params: { id: b.id } })}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">{b.name}</span>
                      <span className="block truncate text-xs capitalize text-muted-foreground">
                        {b.type} · {responsibleName(b.responsible)}
                      </span>
                    </span>
                    <StatusBadge status={b.status} />
                  </div>
                  <dl className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between gap-3">
                      <dt>Committed</dt>
                      <dd className="tabular-nums text-foreground">{money(b.committed_amount)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Achieved</dt>
                      <dd className="tabular-nums text-foreground">{money(b.achieved_amount)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Achieved %</dt>
                      <dd className="tabular-nums text-foreground">
                        {percent(b.achieved_percentage)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>To achieve</dt>
                      <dd className="tabular-nums text-foreground">{money(b.amount_to_achieve)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Period</dt>
                      <dd className="text-foreground">
                        {fmtDate(b.start_date)} – {fmtDate(b.end_date)}
                      </dd>
                    </div>
                  </dl>
                </KanbanCard>
              ))}
            </KanbanGrid>
          )}
          <TablePagination
            page={page}
            limit={LIMIT}
            total={query.data.total}
            onPageChange={setPage}
          />
        </div>
      ) : (
        <EmptyState
          title="No budgets yet"
          description="Create a budget to track committed and achieved amounts."
          action={
            <Button onClick={() => navigate({ to: "/budgets/new" })}>
              <Plus className="size-4" /> New budget
            </Button>
          }
        />
      )}
    </div>
  );
}

const PIE_COLORS = ["#714B67", "#017E84", "#8F8F8F", "#D97B6C", "#C9A24B", "#7A9E7E"];

function BudgetPieCharts({
  budgets,
}: {
  budgets: {
    name: string;
    type: string;
    status: string;
    committed_amount: number | null;
    achieved_amount: number;
    amount_to_achieve: number | null;
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
