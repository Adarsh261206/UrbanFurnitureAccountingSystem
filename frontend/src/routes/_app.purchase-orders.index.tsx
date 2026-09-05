import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, EmptyState, ErrorState } from "@/components/common/States";
import { DataTable, TablePagination, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  KanbanCard,
  KanbanGrid,
  SectionTabs,
  ViewToggle,
  type ViewMode,
} from "@/components/common/ViewToggle";
import { Button } from "@/components/ui/button";
import { purchaseOrdersService } from "@/services/purchaseService";
import { errorMessage } from "@/lib/api/errors";
import { money, date } from "@/lib/format";
import type { PurchaseOrderRow } from "@/types/api";

export const Route = createFileRoute("/_app/purchase-orders/")({
  head: () => ({
    meta: [
      { title: "Purchase orders — Urban Furniture Accounting" },
      { name: "description", content: "Purchase orders in the Urban Furniture Accounting System." },
      { property: "og:title", content: "Purchase orders — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "Purchase orders in the Urban Furniture Accounting System.",
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
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("list");

  const query = useQuery({
    queryKey: ["purchase-orders", page, status, search],
    queryFn: () =>
      purchaseOrdersService.list({
        page,
        limit: LIMIT,
        ...(status ? { status } : {}),
        ...(search ? { search } : {}),
      }),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => purchaseOrdersService.confirm(id),
    onMutate: (id) => setConfirmingId(id),
    onSuccess: () => {
      toast.success("Purchase order confirmed");
      void queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
    onSettled: () => setConfirmingId(null),
  });

  const columns: Column<PurchaseOrderRow>[] = [
    {
      key: "po_number",
      header: "PO number",
      cell: (r) => <span className="font-medium">{r.po_number}</span>,
    },
    { key: "vendor_name", header: "Vendor", cell: (r) => r.vendor_name },
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
              void navigate({ to: "/bills/new", search: { po: r.id } });
            }}
          >
            Create Bill
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase orders"
        crumbs={[{ label: "Purchase" }, { label: "Purchase Order" }]}
        description="Create and confirm vendor purchase orders."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate({ to: "/dashboard" })}>
              Back
            </Button>
            <Button onClick={() => navigate({ to: "/purchase-orders/new" })}>New</Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search PO number or vendor…"
            aria-label="Search purchase orders"
            className="h-9 w-64 rounded-md border border-input bg-card px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
          />
          <SectionTabs
            label="Purchase order status"
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
        <ViewToggle value={view} onChange={setView} label="Purchase order view mode" />
      </div>

      {query.isLoading ? (
        <LoadingState label="Loading purchase orders" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : !query.data || query.data.purchase_orders.length === 0 ? (
        <EmptyState
          title="No purchase orders yet"
          description="Create a purchase order to start the procure-to-pay workflow."
          action={
            <Button onClick={() => navigate({ to: "/purchase-orders/new" })}>
              New purchase order
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {view === "list" ? (
            <DataTable
              columns={columns}
              rows={query.data.purchase_orders}
              rowKey={(r) => r.id}
              onRowClick={(r) => navigate({ to: "/purchase-orders/$id", params: { id: r.id } })}
            />
          ) : (
            <KanbanGrid>
              {query.data.purchase_orders.map((r) => (
                <KanbanCard
                  key={r.id}
                  ariaLabel={`Purchase order ${r.po_number}`}
                  onClick={() => navigate({ to: "/purchase-orders/$id", params: { id: r.id } })}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-foreground">{r.po_number}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{r.vendor_name}</p>
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
