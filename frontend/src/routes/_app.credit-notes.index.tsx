import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { RequireAuth } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, EmptyState, ErrorState } from "@/components/common/States";
import { DataTable, TablePagination, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { SearchInput } from "@/components/common/SearchInput";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { creditNotesService } from "@/services/creditNoteService";
import { contactsService } from "@/services/masterDataService";
import { useAuth } from "@/lib/auth/auth-context";
import { errorMessage } from "@/lib/api/errors";
import { money, date } from "@/lib/format";
import { enumLabel } from "@/lib/labels";
import type { CreditNoteListRow, CreditNoteStatus } from "@/types/api";

export const Route = createFileRoute("/_app/credit-notes/")({
  head: () => ({
    meta: [
      { title: "Credit Notes — Urban Furniture Accounting" },
      { name: "description", content: "Manage credit notes and debit notes." },
      { property: "og:title", content: "Credit Notes — Urban Furniture Accounting" },
      { property: "og:description", content: "Manage credit notes and debit notes." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <CreditNotesPage />
    </RequireAuth>
  ),
});

const LIMIT = 20;

function CreditNotesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "accountant";
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<CreditNoteStatus | "">("");
  const [type, setType] = useState("");
  const [contactId, setContactId] = useState("");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const contactsQuery = useQuery({
    queryKey: ["contacts", "all"],
    queryFn: () => contactsService.list({ limit: 200 }),
    enabled: canManage,
  });

  const query = useQuery({
    queryKey: ["credit-notes", page, status, type, contactId],
    queryFn: () =>
      creditNotesService.list({
        page,
        limit: LIMIT,
        ...(status ? { status } : {}),
        ...(type ? { type } : {}),
        ...(canManage && contactId ? { contact_id: contactId } : {}),
      }),
  });

  const q = search.trim().toLowerCase();
  const rows = q
    ? (query.data?.credit_notes ?? []).filter(
        (r) =>
          r.number.toLowerCase().includes(q) ||
          r.contact_name.toLowerCase().includes(q) ||
          enumLabel(r.type).toLowerCase().includes(q) ||
          enumLabel(r.status).toLowerCase().includes(q),
      )
    : (query.data?.credit_notes ?? []);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => creditNotesService.delete(id),
    onSuccess: () => {
      toast.success("Credit note deleted");
      setDeleteId(null);
      void queryClient.invalidateQueries({ queryKey: ["credit-notes"] });
    },
    onError: (error) => {
      toast.error(errorMessage(error));
      setDeleteId(null);
    },
  });

  const columns: Column<CreditNoteListRow>[] = [
    {
      key: "number",
      header: "Number",
      cell: (r) => (
        <div>
          <p className="font-medium">{r.number}</p>
          <p className="text-xs text-muted-foreground capitalize">{r.type.replace(/_/g, " ")}</p>
        </div>
      ),
    },
    { key: "contact_name", header: "Contact", cell: (r) => r.contact_name },
    { key: "date", header: "Date", cell: (r) => date(r.date) },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusBadge status={r.status} />,
    },
    { key: "total", header: "Total", cell: (r) => money(r.total), align: "right" },
    { key: "amount_due", header: "Due", cell: (r) => money(r.amount_due), align: "right" },
    {
      key: "id",
      header: "",
      cell: (r) =>
        canManage && r.status === "draft" ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(r.id);
            }}
          >
            Delete
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Credit Notes"
        crumbs={[{ label: "Sales" }, { label: "Credit Notes" }]}
        description="Issue credit notes and debit notes against customers or vendors."
        actions={
          canManage ? (
            <Button onClick={() => navigate({ to: "/credit-notes/new" })}>New credit note</Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={status || "__all"}
          onValueChange={(v) => {
            setStatus(v === "__all" ? "" : (v as CreditNoteStatus));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={type || "__all"}
          onValueChange={(v) => {
            setType(v === "__all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All types</SelectItem>
            <SelectItem value="credit_note">Credit Note</SelectItem>
            <SelectItem value="debit_note">Debit Note</SelectItem>
          </SelectContent>
        </Select>
        {canManage ? (
          <Select
            value={contactId || "__all"}
            onValueChange={(v) => {
              setContactId(v === "__all" ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All contacts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All contacts</SelectItem>
              {(contactsQuery.data?.contacts ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      {query.isLoading ? (
        <LoadingState label="Loading credit notes" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : !query.data || query.data.credit_notes.length === 0 ? (
        <EmptyState
          title="No credit notes yet"
          description="Create a credit note to adjust amounts on invoices or bills."
          action={
            canManage ? (
              <Button onClick={() => navigate({ to: "/credit-notes/new" })}>New credit note</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search by number, contact, type or status…"
            label="Search credit notes"
            className="max-w-sm"
          />
          {q && rows.length === 0 ? (
            <div className="rounded-lg border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
              No matching records found
            </div>
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={rows}
                rowKey={(r) => r.id}
                onRowClick={(r) => navigate({ to: "/credit-notes/$id", params: { id: r.id } })}
              />
              <TablePagination
                page={page}
                limit={LIMIT}
                total={q ? rows.length : query.data.total}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      )}

      <ConfirmationModal
        open={!!deleteId}
        onOpenChange={(o) => (o ? undefined : setDeleteId(null))}
        title="Delete this credit note?"
        description="This action cannot be undone. Only draft credit notes can be deleted."
        confirmLabel="Delete"
        destructive
        pending={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
