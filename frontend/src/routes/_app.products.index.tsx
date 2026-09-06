import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Plus, Search, Trash2 } from "lucide-react";
import { imgUrl } from "@/lib/imgUrl";
import { toast } from "sonner";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { DataTable, TablePagination, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
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
import { brandsService, categoriesService, productsService } from "@/services/masterDataService";
import { money } from "@/lib/format";
import type { Product } from "@/types/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/products/")({
  head: () => ({
    meta: [
      { title: "Products — Urban Furniture Accounting" },
      { name: "description", content: "Products in the Urban Furniture Accounting System." },
      { property: "og:title", content: "Products — Urban Furniture Accounting" },
      { property: "og:description", content: "Products in the Urban Furniture Accounting System." },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin", "accountant"]}>
      <Page />
    </RequireRole>
  ),
});

const LIMIT = 20;
const ALL = "__all__";

function Page() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [categoryId, setCategoryId] = useState<string>(ALL);
  const [brandId, setBrandId] = useState<string>(ALL);
  const [view, setView] = useState<ViewMode>("list");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useMemo(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
      setSelected(new Set());
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesService.list(),
  });

  const brandsQuery = useQuery({
    queryKey: ["brands"],
    queryFn: () => brandsService.list({ limit: 100 }),
  });

  const query = useQuery({
    queryKey: ["products", page, debounced, categoryId, brandId],
    queryFn: () =>
      productsService.list({
        page,
        limit: LIMIT,
        ...(debounced ? { search: debounced } : {}),
        ...(categoryId === ALL ? {} : { category_id: categoryId }),
        ...(brandId === ALL ? {} : { brand_id: brandId }),
      }),
  });

  const bulkDelete = useMutation({
    mutationFn: () => productsService.bulkDelete([...selected]),
    onSuccess: () => {
      toast.success(`${selected.size} product(s) deleted`);
      setSelected(new Set());
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const bulkToggle = useMutation({
    mutationFn: (isActive: boolean) => productsService.bulkToggle([...selected], isActive),
    onSuccess: (_data, isActive) => {
      toast.success(`${selected.size} product(s) ${isActive ? "activated" : "deactivated"}`);
      setSelected(new Set());
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const columns: Column<Product>[] = [
    {
      key: "name",
      header: "Name",
      cell: (r) => (
        <span className="flex items-center gap-2">
          <span className="font-medium text-foreground">{r.name}</span>
          {!r.is_active ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Inactive
            </span>
          ) : null}
        </span>
      ),
    },
    { key: "sku", header: "SKU", cell: (r) => r.sku ?? "—" },
    { key: "brand_name", header: "Brand", cell: (r) => r.brand_name ?? "—" },
    { key: "category_name", header: "Category", cell: (r) => r.category_name ?? "—" },
    { key: "product_type", header: "Type", cell: (r) => <StatusBadge status={r.product_type} /> },
    {
      key: "sales_price",
      header: "Sales price",
      cell: (r) => money(r.sales_price),
      align: "right",
    },
    { key: "cost", header: "Cost", cell: (r) => money(r.cost), align: "right" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        crumbs={[{ label: "Master Data" }, { label: "Products" }]}
        description="Goods, services and combo items sold or purchased."
        actions={
          <Button onClick={() => navigate({ to: "/products/new" })}>
            <Plus className="size-4" /> New product
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU or barcode…"
            className="pl-9"
            aria-label="Search products"
          />
        </div>
        <Select
          value={categoryId}
          onValueChange={(v) => {
            setCategoryId(v);
            setPage(1);
            setSelected(new Set());
          }}
        >
          <SelectTrigger className="w-[200px]" aria-label="Filter by category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {(categoriesQuery.data ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={brandId}
          onValueChange={(v) => {
            setBrandId(v);
            setPage(1);
            setSelected(new Set());
          }}
        >
          <SelectTrigger className="w-[200px]" aria-label="Filter by brand">
            <SelectValue placeholder="All brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All brands</SelectItem>
            {(brandsQuery.data?.brands ?? []).map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <ViewToggle value={view} onChange={setView} label="Products view mode" />
        </div>
      </div>

      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
          <span className="text-[13px] font-semibold text-foreground">
            {selected.size} selected
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={bulkToggle.isPending}
              onClick={() => bulkToggle.mutate(true)}
            >
              <Check className="size-3.5" /> Activate
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={bulkToggle.isPending}
              onClick={() => bulkToggle.mutate(false)}
            >
              Deactivate
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={bulkDelete.isPending}
              onClick={() => {
                if (confirm(`Delete ${selected.size} selected product(s)?`)) bulkDelete.mutate();
              }}
            >
              <Trash2 className="size-3.5" /> Delete
            </Button>
          </div>
        </div>
      ) : null}

      {query.isLoading ? (
        <LoadingState label="Loading products" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data && query.data.products.length > 0 ? (
        <div className="space-y-4">
          {view === "list" ? (
            <DataTable
              columns={columns}
              rows={query.data.products}
              rowKey={(r) => r.id}
              onRowClick={(r) => navigate({ to: "/products/$id", params: { id: r.id } })}
              caption="Products"
              selectedKeys={selected}
              onSelectionChange={setSelected}
            />
          ) : (
            <KanbanGrid>
              {query.data.products.map((p) => (
                <KanbanCard
                  key={p.id}
                  ariaLabel={`Open product ${p.name}`}
                  onClick={() => navigate({ to: "/products/$id", params: { id: p.id } })}
                >
                  {p.image_url ? (
                    <img
                      src={imgUrl(p.image_url) ?? ""}
                      alt=""
                      loading="lazy"
                      className="h-32 w-full rounded-md border border-border object-cover"
                    />
                  ) : (
                    <span className="flex h-32 w-full items-center justify-center rounded-md border border-dashed border-border bg-muted/50 text-xs text-muted-foreground">
                      No image
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">{p.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {p.brand_name ? `${p.brand_name} · ` : ""}
                        {p.category_name ?? "—"}
                      </span>
                    </span>
                    <StatusBadge status={p.product_type} />
                  </div>
                  <dl className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between gap-3">
                      <dt>SKU</dt>
                      <dd className="tabular-nums text-foreground">{p.sku ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Sales price</dt>
                      <dd className="tabular-nums text-foreground">{money(p.sales_price)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Cost</dt>
                      <dd className="tabular-nums text-foreground">{money(p.cost)}</dd>
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
          title="No products found"
          description={
            debounced || categoryId !== ALL || brandId !== ALL
              ? "Try a different search or filter."
              : "Create your first product to get started."
          }
          action={
            !debounced && categoryId === ALL && brandId === ALL ? (
              <Button onClick={() => navigate({ to: "/products/new" })}>
                <Plus className="size-4" /> New product
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
