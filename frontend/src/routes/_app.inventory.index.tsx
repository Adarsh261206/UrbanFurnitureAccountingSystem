import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Package, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { DataTable, TablePagination, type Column } from "@/components/common/DataTable";
import { SearchInput } from "@/components/common/SearchInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { inventoryService, type StockAdjustInput } from "@/services/inventoryService";
import { brandsService } from "@/services/masterDataService";
import { money } from "@/lib/format";
import { validateNumber, trimmed } from "@/lib/validation";
import type { StockLevel } from "@/types/api";

export const Route = createFileRoute("/_app/inventory/")({
  head: () => ({
    meta: [
      { title: "Stock Levels — Urban Furniture Accounting" },
      { name: "description", content: "Track product stock levels and inventory." },
      { property: "og:title", content: "Stock Levels — Urban Furniture Accounting" },
      { property: "og:description", content: "Track product stock levels and inventory." },
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
  const [brandId, setBrandId] = useState<string>(ALL);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<StockLevel | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [adjustQtyError, setAdjustQtyError] = useState<string | null>(null);

  useMemo(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const brandsQuery = useQuery({
    queryKey: ["brands"],
    queryFn: () => brandsService.list({ limit: 100 }),
  });

  const summaryQuery = useQuery({
    queryKey: ["inventory-summary"],
    queryFn: () => inventoryService.getStockSummary(),
  });

  const query = useQuery({
    queryKey: ["stock-levels", page, debounced, brandId],
    queryFn: () =>
      inventoryService.getStockLevels({
        page,
        limit: LIMIT,
        ...(debounced ? { search: debounced } : {}),
        ...(brandId === ALL ? {} : { brand_id: brandId }),
      }),
  });

  const adjustMutation = useMutation({
    mutationFn: (data: StockAdjustInput) => inventoryService.adjustStock(data),
    onSuccess: () => {
      toast.success("Stock adjusted successfully");
      setAdjustOpen(false);
      setAdjustProduct(null);
      setAdjustQty("");
      setAdjustNotes("");
      void queryClient.invalidateQueries({ queryKey: ["stock-levels"] });
      void queryClient.invalidateQueries({ queryKey: ["inventory-summary"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openAdjust(row: StockLevel) {
    setAdjustProduct(row);
    setAdjustQty("");
    setAdjustNotes("");
    setAdjustOpen(true);
  }

  function handleAdjust() {
    if (!adjustProduct) return;
    const qty = parseFloat(adjustQty);
    if (isNaN(qty)) {
      toast.error("Enter a valid quantity");
      return;
    }
    adjustMutation.mutate({
      product_id: adjustProduct.product_id,
      quantity: qty,
      notes: trimmed(adjustNotes) || undefined,
    });
  }

  function stockStatus(qty: number): { label: string; className: string } {
    if (qty === 0)
      return { label: "Out of Stock", className: "bg-destructive/10 text-destructive" };
    if (qty <= 10) return { label: "Low Stock", className: "bg-warning/10 text-warning" };
    return { label: "In Stock", className: "bg-success/10 text-success" };
  }

  const columns: Column<StockLevel>[] = [
    {
      key: "sku",
      header: "SKU",
      cell: (r) => r.product_sku ?? "—",
    },
    {
      key: "product_name",
      header: "Product",
      cell: (r) => <span className="font-medium text-foreground">{r.product_name}</span>,
    },
    {
      key: "brand",
      header: "Brand",
      cell: (r) => r.brand ?? "—",
    },
    {
      key: "stock_quantity",
      header: "In Stock",
      cell: (r) => <span className="tabular-nums">{r.stock_quantity}</span>,
      align: "right",
    },
    {
      key: "reserved_qty",
      header: "Reserved",
      cell: (r) => <span className="tabular-nums">{r.reserved_qty}</span>,
      align: "right",
    },
    {
      key: "available_qty",
      header: "Available",
      cell: (r) => <span className="tabular-nums font-medium">{r.available_qty}</span>,
      align: "right",
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => {
        const s = stockStatus(r.stock_quantity);
        return (
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${s.className}`}
          >
            {s.label}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            openAdjust(r);
          }}
        >
          <SlidersHorizontal className="size-3.5 mr-1" /> Adjust
        </Button>
      ),
    },
  ];

  const summary = summaryQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Levels"
        crumbs={[{ label: "Master Data" }, { label: "Stock Levels" }]}
        description="Current inventory quantities across all products."
        backTo="/dashboard"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Products"
          value={summary?.total_products ?? 0}
          icon={<Package className="size-4" />}
        />
        <SummaryCard
          title="Stock Value"
          value={money(summary?.total_stock_value ?? 0)}
          icon={<Package className="size-4" />}
          valueClass="text-foreground"
        />
        <SummaryCard
          title="Low Stock"
          value={summary?.low_stock_count ?? 0}
          icon={<Package className="size-4" />}
          valueClass="text-warning"
        />
        <SummaryCard
          title="Out of Stock"
          value={summary?.out_of_stock_count ?? 0}
          icon={<Package className="size-4" />}
          valueClass="text-destructive"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or SKU…"
          label="Search products"
          className="max-w-sm flex-1 min-w-[220px]"
        />
        <Select
          value={brandId}
          onValueChange={(v) => {
            setBrandId(v);
            setPage(1);
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
      </div>

      {query.isLoading ? (
        <LoadingState label="Loading stock levels" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data && query.data.products.length > 0 ? (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            rows={query.data.products}
            rowKey={(r) => r.product_id}
            caption="Stock Levels"
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
          title="No stock data found"
          description={
            debounced || brandId !== ALL
              ? "Try a different search or filter."
              : "No products have stock levels yet."
          }
        />
      )}

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
          </DialogHeader>
          {adjustProduct && (
            <div className="space-y-4">
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <p className="font-medium">{adjustProduct.product_name}</p>
                <p className="text-muted-foreground">
                  Current stock:{" "}
                  <span className="tabular-nums font-medium text-foreground">
                    {adjustProduct.stock_quantity}
                  </span>
                </p>
              </div>
              <div>
                <label htmlFor="adjust-qty" className="mb-1 block text-sm font-medium">
                  Quantity change
                </label>
                <Input
                  id="adjust-qty"
                  type="number"
                  value={adjustQty}
                  onChange={(e) => {
                    setAdjustQty(e.target.value);
                    setAdjustQtyError(null);
                  }}
                  onBlur={() => setAdjustQtyError(validateNumber(adjustQty, "quantity"))}
                  placeholder="e.g. 10 or -5"
                  aria-invalid={!!adjustQtyError}
                  aria-describedby={adjustQtyError ? "adjust-qty-error" : undefined}
                />
                {adjustQtyError ? (
                  <p id="adjust-qty-error" className="mt-1 text-xs font-medium text-destructive">
                    {adjustQtyError}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  Positive to add stock, negative to remove.
                </p>
              </div>
              <div>
                <label htmlFor="adjust-notes" className="mb-1 block text-sm font-medium">
                  Notes
                </label>
                <Input
                  id="adjust-notes"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Reason for adjustment (optional)"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdjust} disabled={adjustMutation.isPending}>
              {adjustMutation.isPending ? "Saving…" : "Save Adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  valueClass,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{title}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${valueClass ?? "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
