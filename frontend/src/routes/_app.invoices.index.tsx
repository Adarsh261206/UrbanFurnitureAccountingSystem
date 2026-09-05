import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RequireAuth } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, EmptyState, ErrorState } from "@/components/common/States";
import { DataTable, TablePagination, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { invoicesService } from "@/services/salesService";
import { contactsService } from "@/services/masterDataService";
import { useAuth } from "@/lib/auth/auth-context";
import { money, date } from "@/lib/format";
import type { InvoiceListRow, InvoiceStatus } from "@/types/api";

/** Reachable by admin, accountant and user (portal). No role restriction here. */
export const Route = createFileRoute("/_app/invoices/")({
  head: () => ({
    meta: [
      { title: "Invoices — Urban Furniture Accounting" },
      {
        name: "description",
        content: "Review customer invoices, their status and outstanding balances.",
      },
      { property: "og:title", content: "Invoices — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "Review customer invoices, their status and outstanding balances.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <InvoicesPage />
    </RequireAuth>
  ),
});

const LIMIT = 20;

function InvoicesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "accountant";
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const [customerId, setCustomerId] = useState("");

  const contactsQuery = useQuery({
    queryKey: ["contacts", "all"],
    queryFn: () => contactsService.list({ limit: 200 }),
    enabled: canManage,
  });

  const query = useQuery({
    queryKey: ["invoices", page, status, customerId],
    queryFn: () =>
      invoicesService.list({
        page,
        limit: LIMIT,
        ...(status ? { status } : {}),
        ...(canManage && customerId ? { customer_id: customerId } : {}),
      }),
  });

  const columns: Column<InvoiceListRow>[] = [
    {
      key: "invoice_number",
      header: "Invoice",
      cell: (r) => (
        <div>
          <p className="font-medium">{r.invoice_number}</p>
          <p className="text-xs text-muted-foreground">{r.invoice_reference}</p>
        </div>
      ),
    },
    { key: "customer_name", header: "Customer", cell: (r) => r.customer_name },
    { key: "invoice_date", header: "Invoice date", cell: (r) => date(r.invoice_date) },
    { key: "due_date", header: "Due date", cell: (r) => date(r.due_date) },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    { key: "total_amount", header: "Total", cell: (r) => money(r.total_amount), align: "right" },
    { key: "amount_paid", header: "Paid", cell: (r) => money(r.amount_paid), align: "right" },
    { key: "amount_due", header: "Due", cell: (r) => money(r.amount_due), align: "right" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={canManage ? "Invoices" : "My Invoices"}
        description="Track customer invoices, statuses and outstanding balances."
        actions={
          canManage ? <Button onClick={() => navigate({ to: "/invoices/new" })}>New invoice</Button> : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={status || "__all"}
          onValueChange={(v) => {
            setStatus(v === "__all" ? "" : (v as InvoiceStatus));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
        {canManage ? (
          <Select
            value={customerId || "__all"}
            onValueChange={(v) => {
              setCustomerId(v === "__all" ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-56"><SelectValue placeholder="All customers" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All customers</SelectItem>
              {(contactsQuery.data?.contacts ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      {query.isLoading ? (
        <LoadingState label="Loading invoices" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : !query.data || query.data.invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description={
            canManage
              ? "Create an invoice directly, or confirm a sales order first."
              : "No invoices have been issued to you yet."
          }
          action={canManage ? <Button onClick={() => navigate({ to: "/invoices/new" })}>New invoice</Button> : undefined}
        />
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            rows={query.data.invoices}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate({ to: "/invoices/$id", params: { id: r.id } })}
          />
          <TablePagination page={page} limit={LIMIT} total={query.data.total} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
