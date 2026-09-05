import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, EmptyState, ErrorState } from "@/components/common/States";
import { DataTable, TablePagination, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth/auth-context";
import { paymentsService } from "@/services/reportsService";
import { money, date } from "@/lib/format";
import type { PaymentRow } from "@/types/api";

export const Route = createFileRoute("/_app/payments/")({
  head: () => ({
    meta: [
      { title: "Payments — Urban Furniture Accounting" },
      { name: "description", content: "Payments in the Urban Furniture Accounting System." },
      { property: "og:title", content: "Payments — Urban Furniture Accounting" },
      { property: "og:description", content: "Payments in the Urban Furniture Accounting System." },
    ],
  }),
  component: Page,
});

const LIMIT = 20;

function Page() {
  const { user } = useAuth();
  const canSeeBills = user?.role === "admin" || user?.role === "accountant";

  const initialTab = useRouterState({
    select: (s) => (s.location.state as { tab?: "receipts" | "payments" } | undefined)?.tab,
  });
  const [tab, setTab] = useState<"receipts" | "payments">(
    canSeeBills ? (initialTab ?? "receipts") : "receipts",
  );
  const [page, setPage] = useState(1);

  const changeTab = (v: "receipts" | "payments") => {
    setTab(v);
    setPage(1);
  };

  const query = useQuery({
    queryKey: ["payments", tab, page, canSeeBills],
    queryFn: () => paymentsService.list({ page, limit: LIMIT }),
  });

  // A6: admin/accountant see both receipts (invoice) and payments (bill); a
  // portal user only ever receives invoice-linked rows from the backend.
  const rows = (query.data?.payments ?? []).filter((p) =>
    canSeeBills ? (tab === "receipts" ? !!p.invoice_id : !!p.vendor_bill_id) : true,
  );

  const columns: Column<PaymentRow>[] = [
    {
      key: "payment_number",
      header: "Payment",
      cell: (r) => <span className="font-medium">{r.payment_number}</span>,
    },
    {
      key: "document",
      header: "Document",
      cell: (r) =>
        r.invoice_id ? (
          <Link
            to="/invoices/$id"
            params={{ id: r.invoice_id }}
            className="text-primary hover:underline"
          >
            Invoice
          </Link>
        ) : r.vendor_bill_id && canSeeBills ? (
          <Link
            to="/bills/$id"
            params={{ id: r.vendor_bill_id }}
            className="text-primary hover:underline"
          >
            Bill
          </Link>
        ) : (
          "—"
        ),
    },
    { key: "amount", header: "Amount", cell: (r) => money(r.amount), align: "right" },
    {
      key: "payment_via",
      header: "Via",
      cell: (r) => <span className="capitalize">{r.payment_via}</span>,
    },
    { key: "payment_date", header: "Date", cell: (r) => date(r.payment_date) },
    {
      key: "status",
      header: "Status",
      cell: (r) => (r.status ? <StatusBadge status={r.status} /> : "—"),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        crumbs={[{ label: "Sales" }, { label: "Receipt" }]}
        description="All recorded receipts and vendor payments."
      />

      {canSeeBills ? (
        <Tabs value={tab} onValueChange={(v) => changeTab(v as "receipts" | "payments")}>
          <TabsList>
            <TabsTrigger value="receipts">Receipts</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>
        </Tabs>
      ) : null}

      {query.isLoading ? (
        <LoadingState label="Loading payments" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No payments yet"
          description="Payments recorded against invoices or bills will appear here."
        />
      ) : (
        <div className="space-y-4">
          <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />
          <TablePagination
            page={page}
            limit={LIMIT}
            total={query.data?.total ?? rows.length}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
