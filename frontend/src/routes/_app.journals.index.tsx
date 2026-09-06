import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { SearchInput } from "@/components/common/SearchInput";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { journalsService, accountsService } from "@/services/masterDataService";
import { enumLabel } from "@/lib/labels";
import type { Journal } from "@/types/api";

export const Route = createFileRoute("/_app/journals/")({
  head: () => ({
    meta: [
      { title: "Journals — Urban Furniture Accounting" },
      { name: "description", content: "Journals in the Urban Furniture Accounting System." },
      { property: "og:title", content: "Journals — Urban Furniture Accounting" },
      { property: "og:description", content: "Journals in the Urban Furniture Accounting System." },
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
  const [search, setSearch] = useState("");
  const journalsQuery = useQuery({ queryKey: ["journals"], queryFn: () => journalsService.list() });
  const accountsQuery = useQuery({
    queryKey: ["chart-of-accounts"],
    queryFn: () => accountsService.list(),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return journalsQuery.data ?? [];
    return (journalsQuery.data ?? []).filter(
      (j) =>
        j.name.toLowerCase().includes(q) || enumLabel(j.journal_type).toLowerCase().includes(q),
    );
  }, [journalsQuery.data, search]);

  const accountName = (id: string) => accountsQuery.data?.find((a) => a.id === id)?.name ?? id;

  const columns: Column<Journal>[] = [
    {
      key: "name",
      header: "Name",
      cell: (r) => <span className="font-medium text-foreground">{r.name}</span>,
    },
    {
      key: "journal_type",
      header: "Type",
      cell: (r) => <span className="capitalize">{r.journal_type}</span>,
    },
    {
      key: "default_account_id",
      header: "Default account",
      cell: (r) => accountName(r.default_account_id),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journals"
        crumbs={[{ label: "Accounting" }, { label: "Journals" }]}
        description="Journals used to record accounting entries."
        actions={
          <Button onClick={() => navigate({ to: "/journals/new" })}>
            <Plus className="size-4" /> New journal
          </Button>
        }
      />

      {journalsQuery.isLoading ? (
        <LoadingState label="Loading journals" />
      ) : journalsQuery.isError ? (
        <ErrorState error={journalsQuery.error} onRetry={() => journalsQuery.refetch()} />
      ) : journalsQuery.data && journalsQuery.data.length > 0 ? (
        <div className="space-y-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search journals…"
            label="Search journals"
            className="max-w-sm"
          />
          {filtered.length > 0 ? (
            <DataTable columns={columns} rows={filtered} rowKey={(r) => r.id} caption="Journals" />
          ) : (
            <EmptyState title="No matching records found" description="Try a different search." />
          )}
        </div>
      ) : (
        <EmptyState
          title="No journals yet"
          description="Journals will appear here once configured."
        />
      )}
    </div>
  );
}
