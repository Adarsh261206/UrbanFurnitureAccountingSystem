import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { DataTable, TablePagination, type Column } from "@/components/common/DataTable";
import { SearchInput } from "@/components/common/SearchInput";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  journalEntriesService,
  journalsService,
  accountsService,
  contactsService,
} from "@/services/masterDataService";
import { date as fmtDate, money } from "@/lib/format";
import type { JournalEntryRow } from "@/types/api";

export const Route = createFileRoute("/_app/journal-entries/")({
  head: () => ({
    meta: [
      { title: "Journal entries — Urban Furniture Accounting" },
      { name: "description", content: "Journal entries in the Urban Furniture Accounting System." },
      { property: "og:title", content: "Journal entries — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "Journal entries in the Urban Furniture Accounting System.",
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
const STATUSES = ["draft", "posted", "cancelled"];

function Page() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [journalId, setJournalId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useMemo(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const journalsQuery = useQuery({ queryKey: ["journals"], queryFn: () => journalsService.list() });

  const query = useQuery({
    queryKey: ["journal-entries", page, journalId, status, dateFrom, dateTo, debouncedSearch],
    queryFn: () =>
      journalEntriesService.list({
        page,
        limit: LIMIT,
        journal_id: journalId !== "all" ? journalId : undefined,
        status: status !== "all" ? status : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      }),
  });

  const hasActiveFilters =
    journalId !== "all" || status !== "all" || dateFrom !== "" || dateTo !== "" || search !== "";

  function clearFilters() {
    setJournalId("all");
    setStatus("all");
    setDateFrom("");
    setDateTo("");
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
  }

  const columns: Column<JournalEntryRow>[] = [
    {
      key: "entry_number",
      header: "Entry #",
      cell: (r) => <span className="font-medium text-foreground">{r.entry_number}</span>,
    },
    { key: "journal_name", header: "Journal", cell: (r) => r.journal_name },
    { key: "accounting_date", header: "Date", cell: (r) => fmtDate(r.accounting_date) },
    { key: "reference", header: "Reference", cell: (r) => r.reference ?? "—" },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal entries"
        crumbs={[{ label: "Accounting" }, { label: "Journal Entries" }]}
        description="All manual and system-generated accounting entries."
        actions={
          <Button onClick={() => navigate({ to: "/journal-entries/new" })}>
            <Plus className="size-4" /> New entry
          </Button>
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48 space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Journal</span>
          <Select
            value={journalId}
            onValueChange={(v) => {
              setJournalId(v);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All journals</SelectItem>
              {journalsQuery.data?.map((j) => (
                <SelectItem key={j.id} value={j.id}>
                  {j.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-40 space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Status</span>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-40 space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">From</span>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-40 space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">To</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search entries…"
          label="Search entries"
          className="w-56"
        />
        {hasActiveFilters ? (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
            Clear filters
          </Button>
        ) : null}
      </div>

      {query.isLoading ? (
        <LoadingState label="Loading journal entries" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data && query.data.journal_entries.length > 0 ? (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            rows={query.data.journal_entries}
            rowKey={(r) => r.id}
            onRowClick={(r) => setSelectedId(r.id)}
            caption="Journal entries"
          />
          <TablePagination
            page={page}
            limit={LIMIT}
            total={query.data.total}
            onPageChange={setPage}
          />
        </div>
      ) : debouncedSearch ? (
        <EmptyState title="No matching records found" description="Try a different search." />
      ) : (
        <EmptyState
          title="No journal entries yet"
          description="Create a journal entry to record a transaction."
          action={
            <Button onClick={() => navigate({ to: "/journal-entries/new" })}>
              <Plus className="size-4" /> New entry
            </Button>
          }
        />
      )}

      <JournalEntryDetailDialog
        id={selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </div>
  );
}

function JournalEntryDetailDialog({
  id,
  onOpenChange,
}: {
  id: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const detailQuery = useQuery({
    queryKey: ["journal-entries", id],
    queryFn: () => journalEntriesService.get(id as string),
    enabled: !!id,
  });
  const accountsQuery = useQuery({
    queryKey: ["chart-of-accounts"],
    queryFn: () => accountsService.list(),
  });
  const contactsQuery = useQuery({
    queryKey: ["contacts", "all-for-select"],
    queryFn: () => contactsService.list({ limit: 200 }),
  });

  const accountName = (aid: string) => accountsQuery.data?.find((a) => a.id === aid)?.name ?? aid;
  const partnerName = (pid: string | null) =>
    pid ? (contactsQuery.data?.contacts.find((c) => c.id === pid)?.name ?? pid) : "—";

  const totals = useMemo(() => {
    const lines = detailQuery.data?.lines ?? [];
    return {
      debit: lines.reduce((s, l) => s + Number(l.debit), 0),
      credit: lines.reduce((s, l) => s + Number(l.credit), 0),
    };
  }, [detailQuery.data]);

  return (
    <Dialog open={!!id} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Journal entry {detailQuery.data?.entry_number ?? ""}</DialogTitle>
          <DialogDescription>
            {detailQuery.data
              ? `${detailQuery.data.journal_name} · ${fmtDate(detailQuery.data.accounting_date)}`
              : "Loading entry details"}
          </DialogDescription>
        </DialogHeader>

        {detailQuery.isLoading ? (
          <LoadingState label="Loading entry" />
        ) : detailQuery.isError ? (
          <ErrorState error={detailQuery.error} onRetry={() => detailQuery.refetch()} />
        ) : detailQuery.data ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <StatusBadge status={detailQuery.data.status} />
              <span className="text-muted-foreground">
                Reference: {detailQuery.data.reference ?? "—"}
              </span>
            </div>
            <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">
                      Account
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">
                      Partner
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-muted-foreground">
                      Debit
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-muted-foreground">
                      Credit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detailQuery.data.lines.map((l) => (
                    <tr key={l.id} className="border-t border-border">
                      <td className="px-3 py-2">{accountName(l.account_id)}</td>
                      <td className="px-3 py-2">{partnerName(l.partner_id)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{money(l.debit)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{money(l.credit)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border font-medium">
                    <td className="px-3 py-2" colSpan={2}>
                      Total
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{money(totals.debit)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{money(totals.credit)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
