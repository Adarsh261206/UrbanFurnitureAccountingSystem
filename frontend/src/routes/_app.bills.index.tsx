import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, EmptyState, ErrorState } from "@/components/common/States";
import { DataTable, TablePagination, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { billsService } from "@/services/purchaseService";
import { money, date } from "@/lib/format";
import type { BillListRow, InvoiceStatus } from "@/types/api";

export const Route = createFileRoute("/_app/bills/")({
  head: () => ({
    meta: [
      { title: "Bills — Urban Furniture Accounting" },
      { name: "description", content: "Bills in the Urban Furniture Accounting System." },
      { property: "og:title", content: "Bills — Urban Furniture Accounting" },
      { property: "og:description", content: "Bills in the Urban Furniture Accounting System." },
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
  const [status, setStatus] = useState<InvoiceStatus | "">("");

  const query = useQuery({
    queryKey: ["bills", page, status],
    queryFn: () => billsService.list({ page, limit: LIMIT, ...(status ? { status } : {}) }),
  });

  const columns: Column<BillListRow>[] = [
    { key: "bill_reference", header: "Bill", cell: (r) => <span className="font-medium">{r.bill_reference}</span> },
    { key: "vendor_name", header: "Vendor", cell: (r) => r.vendor_name },
    { key: "bill_date", header: "Bill date", cell: (r) => date(r.bill_date) },
    { key: "due_date", header: "Due date", cell: (r) => date(r.due_date) },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    { key: "total_amount", header: "Total", cell: (r) => money(r.total_amount), align: "right" },
    { key: "amount_paid", header: "Paid", cell: (r) => money(r.amount_paid), align: "right" },
    { key: "amount_due", header: "Due", cell: (r) => money(r.amount_due), align: "right" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bills"
        description="Vendor bills, their journal entries and payment status."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate({ to: "/dashboard" })}>
              Back
            </Button>
            <Button onClick={() => navigate({ to: "/bills/new" })}>New bill</Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as InvoiceStatus | "");
            setPage(1);
          }}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {query.isLoading ? (
        <LoadingState label="Loading bills" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : !query.data || query.data.bills.length === 0 ? (
        <EmptyState
          title="No bills yet"
          description="Record a vendor bill to track amounts due."
          action={<Button onClick={() => navigate({ to: "/bills/new" })}>New bill</Button>}
        />
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            rows={query.data.bills}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate({ to: "/bills/$id", params: { id: r.id } })}
          />
          <TablePagination page={page} limit={LIMIT} total={query.data.total} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
