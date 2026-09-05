import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
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
import { categoriesService, productsService } from "@/services/masterDataService";
import { money } from "@/lib/format";
import type { Product } from "@/types/api";

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
const ALL_CATEGORIES = "__all__";

function Page() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [categoryId, setCategoryId] = useState<string>(ALL_CATEGORIES);
  const [view, setView] = useState<ViewMode>("list");

  useMemo(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesService.list(),
  });

  const query = useQuery({
    queryKey: ["products", page, debounced, categoryId],
    queryFn: () =>
      productsService.list({
        page,
        limit: LIMIT,
        ...(debounced ? { search: debounced } : {}),
        ...(categoryId === ALL_CATEGORIES ? {} : { category_id: categoryId }),
      }),
  });

  const columns: Column<Product>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium text-foreground">{r.name}</span> },
    { key: "category_name", header: "Category", cell: (r) => r.category_name ?? "—" },
    { key: "product_type", header: "Type", cell: (r) => <StatusBadge status={r.product_type} /> },
    { key: "sales_price", header: "Sales price", cell: (r) => money(r.sales_price), align: "right" },
    { key: "cost", header: "Cost", cell: (r) => money(r.cost), align: "right" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
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
            placeholder="Search products by name…"
            className="pl-9"
            aria-label="Search products"
          />
        </div>
        <Select
          value={categoryId}
          onValueChange={(v) => {
            setCategoryId(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[220px]" aria-label="Filter by category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
            {(categoriesQuery.data ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <ViewToggle value={view} onChange={setView} label="Products view mode" />
        </div>
      </div>

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
                      src={p.image_url}
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
                        {p.category_name ?? "—"}
                      </span>
                    </span>
                    <StatusBadge status={p.product_type} />
                  </div>
                  <dl className="space-y-1 text-sm text-muted-foreground">
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
          <TablePagination page={page} limit={LIMIT} total={query.data.total} onPageChange={setPage} />
        </div>
      ) : (
        <EmptyState
          title="No products found"
          description={debounced || categoryId !== ALL_CATEGORIES ? "Try a different search or category." : "Create your first product to get started."}
          action={
            !debounced && categoryId === ALL_CATEGORIES ? (
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
