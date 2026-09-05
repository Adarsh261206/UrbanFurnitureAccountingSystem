import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  FileText,
  PiggyBank,
  Plus,
  Receipt,
  ShoppingCart,
} from "lucide-react";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { TableSkeleton, ErrorState } from "@/components/common/States";
import { dashboardService } from "@/services/reportsService";
import type { DashboardCounts } from "@/types/api";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Urban Furniture Accounting" },
      {
        name: "description",
        content:
          "Sales, purchase and budget activity counts for the Urban Furniture accounting workspace.",
      },
      { property: "og:title", content: "Dashboard — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "Sales, purchase and budget activity at a glance.",
      },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin", "accountant"]}>
      <DashboardPage />
    </RequireRole>
  ),
});

function todayLabel(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function DashboardPage() {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardService.get(),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        crumbs={[{ label: "Overview" }]}
        description={todayLabel()}
        actions={
          <>
            <Link
              to="/invoices/new"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-secondary px-3.5 text-[13px] font-semibold text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/80"
            >
              <Plus className="size-4" aria-hidden />
              New Invoice
            </Link>
            <Link
              to="/bills/new"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-secondary px-3.5 text-[13px] font-semibold text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/80"
            >
              <Plus className="size-4" aria-hidden />
              New Bill
            </Link>
          </>
        }
      />

      {query.isPending ? <TableSkeleton rows={4} columns={4} /> : null}
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : null}

      {query.data ? (
        <>
          <section aria-label="Overview" className="grid gap-4 md:grid-cols-3">
            <KpiCard
              title="Sales"
              icon={<Receipt className="size-4" aria-hidden />}
              counts={query.data.sales}
              to="/invoices"
              linkLabel="View invoices"
            />
            <KpiCard
              title="Purchase"
              icon={<ShoppingCart className="size-4" aria-hidden />}
              counts={query.data.purchase}
              to="/bills"
              linkLabel="View bills"
            />
            <KpiCard
              title="Budgets"
              icon={<PiggyBank className="size-4" aria-hidden />}
              counts={query.data.budgets}
              to="/budgets"
              linkLabel="View budgets"
            />
          </section>

          <section aria-label="Quick actions">
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Quick actions
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <QuickAction to="/sales-orders/new" label="New sales order" />
              <QuickAction to="/purchase-orders/new" label="New purchase order" />
              <QuickAction to="/journal-entries/new" label="New journal entry" />
              <QuickAction to="/reports/profit-and-loss" label="Profit and loss" />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function KpiCard({
  title,
  icon,
  counts,
  to,
  linkLabel,
}: {
  title: string;
  icon: React.ReactNode;
  counts: DashboardCounts;
  to: "/invoices" | "/bills" | "/budgets";
  linkLabel: string;
}) {
  return (
    <article className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            {icon}
          </span>
          {title}
        </span>
        <span className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
          {counts.total}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-[13px]">
        <div className="rounded-md bg-muted/60 px-3 py-2">
          <dt className="text-xs text-muted-foreground">Draft</dt>
          <dd className="text-base font-semibold tabular-nums text-foreground">{counts.draft}</dd>
        </div>
        <div className="rounded-md bg-muted/60 px-3 py-2">
          <dt className="text-xs text-muted-foreground">Confirmed</dt>
          <dd className="text-base font-semibold tabular-nums text-foreground">
            {counts.confirmed}
          </dd>
        </div>
      </dl>
      <Link
        to={to}
        className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-primary transition-colors hover:text-[#01666b]"
      >
        {linkLabel}
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </article>
  );
}

function QuickAction({
  to,
  label,
}: {
  to:
    | "/sales-orders/new"
    | "/purchase-orders/new"
    | "/journal-entries/new"
    | "/reports/profit-and-loss";
  label: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between rounded-lg border bg-card px-4 py-3 text-[13px] font-medium text-foreground shadow-sm transition-[border-color,box-shadow] hover:border-ring/40 hover:shadow-md"
    >
      <span className="flex items-center gap-2.5">
        <FileText className="size-4 text-muted-foreground" aria-hidden />
        {label}
      </span>
      <ArrowUpRight
        className="size-4 text-muted-foreground transition-colors group-hover:text-primary"
        aria-hidden
      />
    </Link>
  );
}
