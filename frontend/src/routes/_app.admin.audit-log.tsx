import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, Filter, X } from "lucide-react";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { DataTable, TablePagination, type Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auditService } from "@/services/auditService";
import { date } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AuditLogEntry } from "@/types/api";

export const Route = createFileRoute("/_app/admin/audit-log")({
  head: () => ({
    meta: [
      { title: "Audit Log — Urban Furniture Accounting" },
      { name: "description", content: "Audit trail for all system actions." },
      { property: "og:title", content: "Audit Log — Urban Furniture Accounting" },
      { property: "og:description", content: "Audit trail for all system actions." },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin"]}>
      <Page />
    </RequireRole>
  ),
});

const LIMIT = 20;

const ACTION_COLORS: Record<string, string> = {
  create: "bg-emerald-500/10 text-emerald-600",
  update: "bg-blue-500/10 text-blue-600",
  delete: "bg-red-500/10 text-red-600",
  confirm: "bg-teal-500/10 text-teal-600",
  cancel: "bg-orange-500/10 text-orange-600",
  approve: "bg-emerald-500/10 text-emerald-600",
  reject: "bg-red-500/10 text-red-600",
};

const ENTITY_COLORS: Record<string, string> = {
  invoice: "bg-violet-500/10 text-violet-600",
  bill: "bg-amber-500/10 text-amber-600",
  contact: "bg-cyan-500/10 text-cyan-600",
  product: "bg-indigo-500/10 text-indigo-600",
  payment: "bg-emerald-500/10 text-emerald-600",
  user: "bg-slate-500/10 text-slate-600",
  journal_entry: "bg-blue-500/10 text-blue-600",
  budget: "bg-orange-500/10 text-orange-600",
};

const ENTITY_OPTIONS = [
  { value: "", label: "All Entities" },
  { value: "invoice", label: "Invoice" },
  { value: "bill", label: "Bill" },
  { value: "contact", label: "Contact" },
  { value: "product", label: "Product" },
  { value: "payment", label: "Payment" },
  { value: "user", label: "User" },
  { value: "journal_entry", label: "Journal Entry" },
  { value: "budget", label: "Budget" },
];

const ACTION_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "confirm", label: "Confirm" },
  { value: "cancel", label: "Cancel" },
  { value: "approve", label: "Approve" },
  { value: "reject", label: "Reject" },
];

function ActionBadge({ action }: { action: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize",
        ACTION_COLORS[action] ?? "bg-secondary text-secondary-foreground",
      )}
    >
      {action}
    </span>
  );
}

function EntityBadge({ entity }: { entity: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize",
        ENTITY_COLORS[entity] ?? "bg-secondary text-secondary-foreground",
      )}
    >
      {entity.replace(/_/g, " ")}
    </span>
  );
}

function DetailDialog({ log, onClose }: { log: AuditLogEntry; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl border bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Audit Log Detail</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-[13px]">
            <div>
              <span className="text-muted-foreground">Time</span>
              <p className="font-medium">{date(log.created_at)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">User</span>
              <p className="font-medium">{log.user_name ?? "System"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Action</span>
              <p className="mt-0.5">
                <ActionBadge action={log.action} />
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Entity</span>
              <p className="mt-0.5">
                <EntityBadge entity={log.entity} />
              </p>
            </div>
            {log.entity_name && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Entity Name</span>
                <p className="font-medium">{log.entity_name}</p>
              </div>
            )}
            {log.ip_address && (
              <div>
                <span className="text-muted-foreground">IP Address</span>
                <p className="font-medium font-mono text-xs">{log.ip_address}</p>
              </div>
            )}
          </div>

          {log.old_values && Object.keys(log.old_values).length > 0 && (
            <div>
              <h3 className="mb-2 text-[13px] font-semibold text-muted-foreground">
                Previous Values
              </h3>
              <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
                {JSON.stringify(log.old_values, null, 2)}
              </pre>
            </div>
          )}

          {log.new_values && Object.keys(log.new_values).length > 0 && (
            <div>
              <h3 className="mb-2 text-[13px] font-semibold text-muted-foreground">New Values</h3>
              <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
                {JSON.stringify(log.new_values, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Page() {
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const query = useQuery({
    queryKey: ["audit-logs", page, entity, action, fromDate, toDate],
    queryFn: () =>
      auditService.list({
        page,
        limit: LIMIT,
        entity: entity || undefined,
        action: action || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      }),
  });

  const hasFilters = entity || action || fromDate || toDate;

  const columns: Column<AuditLogEntry>[] = [
    {
      key: "created_at",
      header: "Time",
      cell: (r) => <span className="text-[13px]">{date(r.created_at)}</span>,
    },
    {
      key: "user_name",
      header: "User",
      cell: (r) => <span className="font-medium">{r.user_name ?? "System"}</span>,
    },
    {
      key: "action",
      header: "Action",
      cell: (r) => <ActionBadge action={r.action} />,
    },
    {
      key: "entity",
      header: "Entity",
      cell: (r) => (
        <span className="flex items-center gap-2">
          <EntityBadge entity={r.entity} />
          {r.entity_name && (
            <span className="text-muted-foreground text-[12px] truncate max-w-[120px]">
              {r.entity_name}
            </span>
          )}
        </span>
      ),
    },
    {
      key: "ip_address",
      header: "IP",
      cell: (r) => (
        <span className="font-mono text-[11px] text-muted-foreground">{r.ip_address ?? "—"}</span>
      ),
    },
    {
      key: "details",
      header: "",
      cell: () => (
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Eye className="size-3.5 text-muted-foreground" />
        </Button>
      ),
      align: "right",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        backTo="/users"
        crumbs={[{ label: "Administration" }, { label: "Audit Log" }]}
        description="Track all system actions for compliance and debugging."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(showFilters && "bg-accent")}
        >
          <Filter className="size-3.5" /> Filters
          {hasFilters && (
            <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
              {[entity, action, fromDate, toDate].filter(Boolean).length}
            </span>
          )}
        </Button>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEntity("");
              setAction("");
              setFromDate("");
              setToDate("");
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 gap-3 rounded-lg border bg-card p-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
              Entity
            </label>
            <select
              value={entity}
              onChange={(e) => {
                setEntity(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-md border bg-transparent px-2 text-[13px]"
            >
              {ENTITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
              Action
            </label>
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-md border bg-transparent px-2 text-[13px]"
            >
              {ACTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
              From Date
            </label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="h-9 text-[13px]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
              To Date
            </label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="h-9 text-[13px]"
            />
          </div>
        </div>
      )}

      {query.isLoading ? (
        <LoadingState label="Loading audit logs" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data && query.data.logs.length > 0 ? (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            rows={query.data.logs}
            rowKey={(r) => String(r.id)}
            onRowClick={(r) => setSelectedLog(r)}
          />
          <TablePagination
            page={page}
            limit={LIMIT}
            total={query.data.total}
            onPageChange={setPage}
          />
        </div>
      ) : (
        <EmptyState
          title="No audit logs yet"
          description="Actions performed in the system will be recorded here."
        />
      )}

      {selectedLog && <DetailDialog log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}
