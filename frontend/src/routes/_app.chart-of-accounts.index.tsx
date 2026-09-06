import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { accountsService } from "@/services/masterDataService";
import type { ChartOfAccount } from "@/types/api";

export const Route = createFileRoute("/_app/chart-of-accounts/")({
  head: () => ({
    meta: [
      { title: "Chart of accounts — Urban Furniture Accounting" },
      {
        name: "description",
        content: "Chart of accounts in the Urban Furniture Accounting System.",
      },
      { property: "og:title", content: "Chart of accounts — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "Chart of accounts in the Urban Furniture Accounting System.",
      },
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
  const query = useQuery({
    queryKey: ["chart-of-accounts"],
    queryFn: () => accountsService.list(),
  });

  const columns: Column<ChartOfAccount>[] = [
    {
      key: "name",
      header: "Name",
      cell: (r) => <span className="font-medium text-foreground">{r.name}</span>,
    },
    { key: "account_type", header: "Type", cell: (r) => <StatusBadge status={r.account_type} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chart of accounts"
        crumbs={[{ label: "Accounting" }, { label: "Chart of Accounts" }]}
        description="Ledger accounts used across journals, invoices and bills."
        actions={
          <Button onClick={() => navigate({ to: "/chart-of-accounts/new" })}>
            <Plus className="size-4" /> New account
          </Button>
        }
      />

      {query.isLoading ? (
        <LoadingState label="Loading accounts" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data && query.data.length > 0 ? (
        <DataTable
          columns={columns}
          rows={query.data}
          rowKey={(r) => r.id}
          caption="Chart of accounts"
        />
      ) : (
        <EmptyState
          title="No accounts yet"
          description="Create your first ledger account to start recording journal entries."
          action={
            <Button onClick={() => navigate({ to: "/chart-of-accounts/new" })}>
              <Plus className="size-4" /> New account
            </Button>
          }
        />
      )}
    </div>
  );
}
