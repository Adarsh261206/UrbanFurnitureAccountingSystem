import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { DataTable, TablePagination, type Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brandsService } from "@/services/masterDataService";
import type { Brand } from "@/types/api";

export const Route = createFileRoute("/_app/brands/")({
  head: () => ({
    meta: [
      { title: "Brands — Urban Furniture Accounting" },
      { name: "description", content: "Product brands in the Urban Furniture Accounting System." },
      { property: "og:title", content: "Brands — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "Product brands in the Urban Furniture Accounting System.",
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
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [editing, setEditing] = useState<Brand | null>(null);
  const [editName, setEditName] = useState("");

  useMemo(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const query = useQuery({
    queryKey: ["brands", page, debounced],
    queryFn: () =>
      brandsService.list({ page, limit: LIMIT, ...(debounced ? { search: debounced } : {}) }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => brandsService.delete(id),
    onSuccess: () => {
      toast.success("Brand deleted");
      void queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: () => brandsService.update(editing!.id, { name: editName.trim() }),
    onSuccess: () => {
      toast.success("Brand updated");
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const columns: Column<Brand>[] = [
    {
      key: "name",
      header: "Name",
      cell: (r) => <span className="font-medium text-foreground">{r.name}</span>,
    },
    {
      key: "product_count",
      header: "Products",
      cell: (r) => (
        <span className="tabular-nums text-muted-foreground">{r.product_count ?? 0}</span>
      ),
      align: "right",
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <span className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(r);
              setEditName(r.name);
            }}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete brand "${r.name}"?`)) deleteMutation.mutate(r.id);
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brands"
        crumbs={[{ label: "Master Settings" }, { label: "Brands" }]}
        description="Manufacturers and brands linked to products."
        actions={
          <Button onClick={() => navigate({ to: "/brands/new" })}>
            <Plus className="size-4" /> New brand
          </Button>
        }
      />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search brands…"
          className="pl-9"
          aria-label="Search brands"
        />
      </div>

      {editing ? (
        <div className="flex max-w-md items-end gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="flex-1">
            <label
              htmlFor="edit-brand"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Rename brand
            </label>
            <Input id="edit-brand" value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <Button
            size="sm"
            disabled={updateMutation.isPending}
            onClick={() => updateMutation.mutate()}
          >
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
            Cancel
          </Button>
        </div>
      ) : null}

      {query.isLoading ? (
        <LoadingState label="Loading brands" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data && query.data.brands.length > 0 ? (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            rows={query.data.brands}
            rowKey={(r) => r.id}
            caption="Brands"
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
          title="No brands found"
          description={
            debounced ? "Try a different search." : "Create your first brand to get started."
          }
          action={
            !debounced ? (
              <Button onClick={() => navigate({ to: "/brands/new" })}>
                <Plus className="size-4" /> New brand
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
