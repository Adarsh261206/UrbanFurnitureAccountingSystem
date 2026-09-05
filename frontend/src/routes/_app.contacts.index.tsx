import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { DataTable, TablePagination, type Column } from "@/components/common/DataTable";
import { KanbanCard, KanbanGrid, ViewToggle, type ViewMode } from "@/components/common/ViewToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { contactsService } from "@/services/masterDataService";
import { date as fmtDate } from "@/lib/format";
import type { Contact, ContactType } from "@/types/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/contacts/")({
  head: () => ({
    meta: [
      { title: "Contacts — Urban Furniture Accounting" },
      { name: "description", content: "Contacts in the Urban Furniture Accounting System." },
      { property: "og:title", content: "Contacts — Urban Furniture Accounting" },
      { property: "og:description", content: "Contacts in the Urban Furniture Accounting System." },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin", "accountant"]}>
      <Page />
    </RequireRole>
  ),
});

const LIMIT = 20;
const ALL_TYPES = "__all__";

const TYPE_STYLES: Record<ContactType, string> = {
  customer: "bg-blue-500/10 text-blue-600",
  vendor: "bg-emerald-500/10 text-emerald-600",
  both: "bg-violet-500/10 text-violet-600",
};

function TypeBadge({ type }: { type: ContactType }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        TYPE_STYLES[type],
      )}
    >
      {type}
    </span>
  );
}

function Page() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>(ALL_TYPES);
  const [view, setView] = useState<ViewMode>("list");

  useMemo(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const query = useQuery({
    queryKey: ["contacts", page, debounced, typeFilter],
    queryFn: () =>
      contactsService.list({
        page,
        limit: LIMIT,
        ...(debounced ? { search: debounced } : {}),
        ...(typeFilter === ALL_TYPES ? {} : { contact_type: typeFilter as ContactType }),
      }),
  });

  const columns: Column<Contact>[] = [
    {
      key: "name",
      header: "Name",
      cell: (r) => (
        <span className="flex items-center gap-2">
          <span className="font-medium text-foreground">{r.name}</span>
          <TypeBadge type={r.contact_type} />
        </span>
      ),
    },
    { key: "email", header: "Email", cell: (r) => r.email },
    { key: "phone", header: "Phone", cell: (r) => r.phone ?? "—" },
    { key: "city", header: "City", cell: (r) => r.city ?? "—" },
    { key: "gstin", header: "GSTIN", cell: (r) => r.gstin ?? "—" },
    { key: "created_at", header: "Created", cell: (r) => fmtDate(r.created_at) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        crumbs={[{ label: "Master Settings" }, { label: "Contact" }]}
        description="Customers and vendors used across sales, purchase and invoicing."
        actions={
          <Button onClick={() => navigate({ to: "/contacts/new" })}>
            <Plus className="size-4" /> New contact
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts by name or email…"
            className="pl-9"
            aria-label="Search contacts"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]" aria-label="Filter by contact type">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_TYPES}>All types</SelectItem>
              <SelectItem value="customer">Customers</SelectItem>
              <SelectItem value="vendor">Vendors</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
          <ViewToggle value={view} onChange={setView} label="Contacts view mode" />
        </div>
      </div>

      {query.isLoading ? (
        <LoadingState label="Loading contacts" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data && query.data.contacts.length > 0 ? (
        <div className="space-y-4">
          {view === "list" ? (
            <DataTable
              columns={columns}
              rows={query.data.contacts}
              rowKey={(r) => r.id}
              onRowClick={(r) => navigate({ to: "/contacts/$id", params: { id: r.id } })}
              caption="Contacts"
            />
          ) : (
            <KanbanGrid>
              {query.data.contacts.map((c) => (
                <KanbanCard
                  key={c.id}
                  ariaLabel={`Open contact ${c.name}`}
                  onClick={() => navigate({ to: "/contacts/$id", params: { id: c.id } })}
                >
                  <div className="flex items-center gap-3">
                    {c.image_url ? (
                      <img
                        src={c.image_url}
                        alt=""
                        loading="lazy"
                        className="size-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {c.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">{c.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {c.email}
                      </span>
                    </span>
                  </div>
                  <div className="mt-2">
                    <TypeBadge type={c.contact_type} />
                  </div>
                  <dl className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between gap-3">
                      <dt>Phone</dt>
                      <dd className="text-foreground">{c.phone ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>City</dt>
                      <dd className="text-foreground">{c.city ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>GSTIN</dt>
                      <dd className="text-foreground">{c.gstin ?? "—"}</dd>
                    </div>
                  </dl>
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
      ) : (
        <EmptyState
          title="No contacts found"
          description={
            debounced || typeFilter !== ALL_TYPES
              ? "Try a different search or filter."
              : "Create your first contact to get started."
          }
          action={
            !debounced && typeFilter === ALL_TYPES ? (
              <Button onClick={() => navigate({ to: "/contacts/new" })}>
                <Plus className="size-4" /> New contact
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
