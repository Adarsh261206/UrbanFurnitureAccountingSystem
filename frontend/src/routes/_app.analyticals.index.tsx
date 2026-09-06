import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { analyticalsService } from "@/services/masterDataService";
import { date as fmtDate } from "@/lib/format";
import type { Analytical } from "@/types/api";

export const Route = createFileRoute("/_app/analyticals/")({
  head: () => ({
    meta: [
      { title: "Analyticals — Urban Furniture Accounting" },
      {
        name: "description",
        content:
          "Analytical accounts used for budget and cost tracking in Urban Furniture Accounting.",
      },
      { property: "og:title", content: "Analyticals — Urban Furniture Accounting" },
      { property: "og:description", content: "Analytical accounts for budget and cost tracking." },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin", "accountant"]}>
      <Page />
    </RequireRole>
  ),
});

function Page() {
  const navigate = useNavigate();
  const query = useQuery({ queryKey: ["analyticals"], queryFn: () => analyticalsService.list() });

  const columns: Column<Analytical>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "analytic_account", header: "Analytic account", cell: (r) => r.analytic_account },
    { key: "start_date", header: "Start date", cell: (r) => fmtDate(r.start_date) },
    { key: "to_date", header: "To date", cell: (r) => fmtDate(r.to_date) },
    { key: "end_date", header: "End date", cell: (r) => fmtDate(r.end_date) },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (r) => (
        <Link to="/analyticals/$id" params={{ id: r.id }} className="text-primary hover:underline">
          Open
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analyticals"
        crumbs={[{ label: "Accounting" }, { label: "Analyticals" }]}
        description="Analytical accounts available for budgets and document lines."
        actions={<Button onClick={() => navigate({ to: "/analyticals/new" })}>New</Button>}
      />

      {query.isLoading ? (
        <LoadingState label="Loading analyticals" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : !query.data || query.data.length === 0 ? (
        <EmptyState
          title="No analytical accounts yet"
          description="Create an analytical account to track budgets and costs."
          action={
            <Button onClick={() => navigate({ to: "/analyticals/new" })}>New analytical</Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          rows={query.data}
          rowKey={(r) => r.id}
          onRowClick={(r) => navigate({ to: "/analyticals/$id", params: { id: r.id } })}
        />
      )}
    </div>
  );
}
