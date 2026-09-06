import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Cell, Pie, PieChart } from "recharts";
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

  const columns: Column<BudgetListRow>[] = [
    {
      key: "name",
      header: "Budget",
      cell: (r) => <span className="font-medium text-foreground">{r.name}</span>,
    },
    { key: "start_date", header: "Start Date", cell: (r) => fmtDate(r.start_date) },
    { key: "end_date", header: "End Date", cell: (r) => fmtDate(r.end_date) },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    {
      key: "achieved_percentage",
      header: "Pie Chart",
      cell: (r) => <RowPie budget={r} />,
    },
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
                        {b.type} ·{" "}
                        {typeof b.responsible === "string"
                          ? b.responsible
                          : ((b.responsible as { name?: string })?.name ?? "—")}
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

const PIE_ACHIEVED = "#017E84";
const PIE_BALANCE = "#D97B6C";

function RowPie({ budget }: { budget: BudgetListRow }) {
  const achieved = Math.min(budget.achieved_amount, budget.committed_amount ?? 0);
  const balance = Math.max((budget.committed_amount ?? 0) - achieved, 0);

  const data = [
    { name: "Achieved", value: achieved },
    { name: "Balance", value: balance },
  ].filter((d) => d.value > 0);

  if (data.length === 0 || (budget.committed_amount ?? 0) === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="inline-flex flex-col items-center gap-0.5">
      <PieChart width={48} height={48}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={12}
          outerRadius={20}
          strokeWidth={1}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.name === "Achieved" ? PIE_ACHIEVED : PIE_BALANCE} />
          ))}
        </Pie>
      </PieChart>
      <span className="text-[10px] text-muted-foreground">
        {percent(budget.achieved_percentage)}
      </span>
    </div>
  );
}
