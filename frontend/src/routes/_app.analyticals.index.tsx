import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { SearchInput } from "@/components/common/SearchInput";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { analyticalsService, contactsService } from "@/services/masterDataService";
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
  const [search, setSearch] = useState("");
  const query = useQuery({ queryKey: ["analyticals"], queryFn: () => analyticalsService.list() });
  const contactsQuery = useQuery({
    queryKey: ["contacts", "all-for-select"],
    queryFn: () => contactsService.list({ limit: 200 }),
  });

  const responsibleName = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of contactsQuery.data?.contacts ?? []) map.set(c.id, c.name);
    return (id: string) => map.get(id) ?? "";
  }, [contactsQuery.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return query.data ?? [];
    return (query.data ?? []).filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        responsibleName(a.responsible_id).toLowerCase().includes(q),
    );
  }, [query.data, search, responsibleName]);

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
        <div className="space-y-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search analyticals…"
            label="Search analyticals"
            className="max-w-sm"
          />
          {filtered.length > 0 ? (
            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(r) => r.id}
              onRowClick={(r) => navigate({ to: "/analyticals/$id", params: { id: r.id } })}
            />
          ) : (
            <EmptyState title="No matching records found" description="Try a different search." />
          )}
        </div>
      )}
    </div>
  );
}
