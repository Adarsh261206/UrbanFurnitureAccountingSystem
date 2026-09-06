import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, EmptyState, ErrorState } from "@/components/common/States";
import { DataTable, TablePagination, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SearchInput } from "@/components/common/SearchInput";
import {
  KanbanCard,
  KanbanGrid,
  SectionTabs,
  ViewToggle,
  type ViewMode,
} from "@/components/common/ViewToggle";
import { Button } from "@/components/ui/button";
import { salesOrdersService } from "@/services/salesService";
import { errorMessage } from "@/lib/api/errors";
import { money, date } from "@/lib/format";
import type { SalesOrderRow } from "@/types/api";

export const Route = createFileRoute("/_app/sales-orders/")({
  head: () => ({
    meta: [
      { title: "Sales orders — Urban Furniture Accounting" },
      { name: "description", content: "Sales orders in the Urban Furniture Accounting System." },
      { property: "og:title", content: "Sales orders — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "Sales orders in the Urban Furniture Accounting System.",
      },
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
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("list");

  useMemo(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const query = useQuery({
    queryKey: ["sales-orders", page, status, debouncedSearch],
    queryFn: () =>
      salesOrdersService.list({
        page,
        limit: LIMIT,
        ...(status ? { status } : {}),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      }),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => salesOrdersService.confirm(id),
    onMutate: (id) => setConfirmingId(id),
    onSuccess: () => {
      toast.success("Sales order confirmed");
      void queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
    onSettled: () => setConfirmingId(null),
  });

  const columns: Column<SalesOrderRow>[] = [
    {
      key: "so_number",
      header: "SO number",
      cell: (r) => <span className="font-medium">{r.so_number}</span>,
    },
    { key: "customer_name", header: "Customer", cell: (r) => r.customer_name },
    { key: "order_date", header: "Order date", cell: (r) => date(r.order_date) },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    { key: "total_amount", header: "Total", cell: (r) => money(r.total_amount), align: "right" },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (r) =>
        r.status === "draft" ? (
          <Button
            size="sm"
            variant="outline"
            disabled={confirmMutation.isPending && confirmingId === r.id}
            onClick={(e) => {
              e.stopPropagation();
              confirmMutation.mutate(r.id);
            }}
          >
            {confirmMutation.isPending && confirmingId === r.id ? "Confirming…" : "Confirm"}
          </Button>
        ) : r.status === "confirmed" ? (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              void navigate({ to: "/invoices/new", search: { so: r.id } });
            }}
          >
            Create Invoice
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales orders"
        crumbs={[{ label: "Sales" }, { label: "Sales Orders" }]}
        description="Create and confirm customer sales orders."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate({ to: "/dashboard" })}>
              Back
            </Button>
            <Button onClick={() => navigate({ to: "/sales-orders/new" })}>New</Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search SO number or customer…"
            label="Search sales orders"
            className="w-64"
          />
          <SectionTabs
            label="Sales order status"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={[
              { value: "", label: "All" },
              { value: "confirmed", label: "Confirmed" },
              { value: "draft", label: "Draft" },
            ]}
          />
        </div>
        <ViewToggle value={view} onChange={setView} label="Sales order view mode" />
      </div>

      {query.isLoading ? (
        <LoadingState label="Loading sales orders" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : !query.data || query.data.sales_orders.length === 0 ? (
        <EmptyState
          title="No sales orders yet"
          description="Create a sales order to start the order-to-cash workflow."
          action={
            <Button onClick={() => navigate({ to: "/sales-orders/new" })}>New sales order</Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {view === "list" ? (
            <DataTable
              columns={columns}
              rows={query.data.sales_orders}
              rowKey={(r) => r.id}
              onRowClick={(r) => navigate({ to: "/sales-orders/$id", params: { id: r.id } })}
            />
          ) : (
            <KanbanGrid>
              {query.data.sales_orders.map((r) => (
                <KanbanCard
                  key={r.id}
                  ariaLabel={`Sales order ${r.so_number}`}
                  onClick={() => navigate({ to: "/sales-orders/$id", params: { id: r.id } })}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-foreground">{r.so_number}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{r.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{date(r.order_date)}</p>
                  <p className="mt-auto text-base font-semibold tabular-nums text-foreground">
                    {money(r.total_amount)}
                  </p>
                  {r.status === "draft" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={confirmMutation.isPending && confirmingId === r.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmMutation.mutate(r.id);
                      }}
                    >
                      {confirmMutation.isPending && confirmingId === r.id
                        ? "Confirming…"
                        : "Confirm"}
                    </Button>
                  ) : null}
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
      )}
    </div>
  );
}
