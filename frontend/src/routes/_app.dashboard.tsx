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
import { ChartCard } from "@/components/charts/ChartCard";
import { RevenueExpenseChart } from "@/components/charts/RevenueExpenseChart";
import { InvoiceStatusChart } from "@/components/charts/InvoiceStatusChart";
import { TopCustomersChart } from "@/components/charts/TopCustomersChart";
import { CashFlowChart } from "@/components/charts/CashFlowChart";

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
  const summary = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => dashboardService.summary(),
  });

  return (
    <div className="space-y-6">
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

      {query.isPending || summary.isPending ? <TableSkeleton rows={4} columns={4} /> : null}
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : null}

      {query.data ? (
        <section aria-label="Document activity" className="grid gap-4 md:grid-cols-3">
          <CountCard
            title="Sales"
            icon={<Receipt className="size-4" aria-hidden />}
            counts={query.data.sales}
            to="/invoices"
            linkLabel="View invoices"
          />
          <CountCard
            title="Purchase"
            icon={<ShoppingCart className="size-4" aria-hidden />}
            counts={query.data.purchase}
            to="/bills"
            linkLabel="View bills"
          />
          <CountCard
            title="Budgets"
            icon={<PiggyBank className="size-4" aria-hidden />}
            counts={query.data.budgets}
            to="/budgets"
            linkLabel="View budgets"
          />
        </section>
      ) : null}

      {summary.data ? (
        <section aria-label="Charts" className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Revenue vs Expense"
            subtitle="Last 6 months — confirmed invoices vs bills"
          >
            <RevenueExpenseChart data={summary.data.monthly_revenue_expense} />
          </ChartCard>
          <ChartCard title="Invoice Status" subtitle="All customer invoices">
            <InvoiceStatusChart data={summary.data.invoice_status} />
          </ChartCard>
          <ChartCard title="Cash Flow" subtitle="Money in (receipts) vs money out (payments)">
            <CashFlowChart data={summary.data.cash_flow} />
          </ChartCard>
          <ChartCard title="Top Customers — Outstanding" subtitle="Largest unpaid balances">
            {summary.data.top_customers.length > 0 ? (
              <TopCustomersChart data={summary.data.top_customers} />
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">
                No outstanding receivables — all caught up!
              </p>
            )}
          </ChartCard>
        </section>
      ) : null}

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
    </div>
  );
}

/** Whole card is a clickable button — any click navigates to the module. */
function CountCard({
  title,
  icon,
  counts,
  to,
  linkLabel,
}: {
  title: string;
  icon: React.ReactNode;
  counts: { draft: number; confirmed: number; total: number };
  to: "/invoices" | "/bills" | "/budgets";
  linkLabel: string;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-lg border bg-card p-5 shadow-sm transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-ring/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
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
      <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-primary transition-colors group-hover:text-[#5e3c55]">
        {linkLabel}
        <ArrowRight
          className="size-3.5 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </Link>
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
