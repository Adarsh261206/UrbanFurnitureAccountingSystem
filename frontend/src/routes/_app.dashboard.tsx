import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  FileText,
  PiggyBank,
  Receipt,
  ShoppingCart,
} from "lucide-react";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState, LoadingState } from "@/components/common/States";
import { Button } from "@/components/ui/button";
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

/** A3 — counts come from GET /dashboard; never aggregated on the client. */
function DashboardPage() {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardService.get(),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Document counts reported by the accounting service."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/sales-orders">Sales orders</Link>
            </Button>
            <Button asChild>
              <Link to="/invoices/new">New invoice</Link>
            </Button>
          </>
        }
      />

      {query.isPending ? <LoadingState label="Loading dashboard" /> : null}
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : null}

      {query.data ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
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
          </div>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Shortcuts</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Shortcut to="/sales-orders/new" label="New sales order" />
              <Shortcut to="/purchase-orders/new" label="New purchase order" />
              <Shortcut to="/journal-entries/new" label="New journal entry" />
              <Shortcut to="/reports/profit-and-loss" label="Profit and loss" />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function CountCard({
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
    <article className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            {icon}
          </span>
          {title}
        </h2>
        <span className="text-2xl font-semibold tabular-nums text-foreground">
          {counts.total}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md bg-muted/60 px-3 py-2">
          <dt className="text-xs text-muted-foreground">Draft</dt>
          <dd className="text-base font-medium tabular-nums text-foreground">
            {counts.draft}
          </dd>
        </div>
        <div className="rounded-md bg-muted/60 px-3 py-2">
          <dt className="text-xs text-muted-foreground">Confirmed</dt>
          <dd className="text-base font-medium tabular-nums text-foreground">
            {counts.confirmed}
          </dd>
        </div>
      </dl>
      <Button asChild variant="ghost" size="sm" className="mt-3 px-0 text-primary">
        <Link to={to}>
          {linkLabel}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Button>
    </article>
  );
}

function Shortcut({
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
      className="flex items-center justify-between rounded-md border border-border px-3 py-2.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
    >
      <span className="flex items-center gap-2">
        <FileText className="size-4 text-muted-foreground" aria-hidden />
        {label}
      </span>
      <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
    </Link>
  );
}
