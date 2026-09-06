import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { DataTable, TablePagination, type Column } from "@/components/common/DataTable";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inventoryService } from "@/services/inventoryService";
import { productsService } from "@/services/masterDataService";
import { money, date } from "@/lib/format";
import type { StockMove } from "@/types/api";

export const Route = createFileRoute("/_app/inventory/moves")({
  head: () => ({
    meta: [
      { title: "Stock Moves — Urban Furniture Accounting" },
      { name: "description", content: "View all inventory movements and transactions." },
      { property: "og:title", content: "Stock Moves — Urban Furniture Accounting" },
      { property: "og:description", content: "View all inventory movements and transactions." },
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

const TYPE_BADGES: Record<string, string> = {
  purchase: "bg-success/10 text-success",
  sale: "bg-info/10 text-info",
  adjustment: "bg-warning/10 text-warning",
  return_in: "bg-teal-100 text-teal-700",
  return_out: "bg-destructive/10 text-destructive",
};

function Page() {
  const [page, setPage] = useState(1);
  const [productId, setProductId] = useState<string>(ALL);
  const [type, setType] = useState<string>(ALL);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const productsQuery = useQuery({
    queryKey: ["products-list"],
    queryFn: () => productsService.list({ limit: 100 }),
  });

  const query = useQuery({
    queryKey: ["stock-moves", page, productId, type, fromDate, toDate],
    queryFn: () =>
      inventoryService.getStockMoves({
        page,
        limit: LIMIT,
        ...(productId === ALL ? {} : { productId }),
        ...(type === ALL ? {} : { type }),
        ...(fromDate ? { from_date: fromDate } : {}),
        ...(toDate ? { to_date: toDate } : {}),
      }),
  });

  const columns: Column<StockMove>[] = [
    {
      key: "move_date",
      header: "Date",
      cell: (r) => date(r.move_date),
    },
    {
      key: "product_name",
      header: "Product",
      cell: (r) => <span className="font-medium text-foreground">{r.product_name}</span>,
    },
    {
      key: "type",
      header: "Type",
      cell: (r) => {
        const badge = TYPE_BADGES[r.type] ?? "bg-secondary text-secondary-foreground";
        return (
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ${badge}`}
          >
            {r.type.replace(/_/g, " ")}
          </span>
        );
      },
    },
    {
      key: "reference_type",
      header: "Reference",
      cell: (r) => {
        if (!r.reference_type) return "—";
        return <span className="text-muted-foreground">{r.reference_type.replace(/_/g, " ")}</span>;
      },
    },
    {
      key: "quantity",
      header: "Qty",
      cell: (r) => (
        <span className={`tabular-nums ${r.quantity < 0 ? "text-destructive" : "text-success"}`}>
          {r.quantity > 0 ? "+" : ""}
          {r.quantity}
        </span>
      ),
      align: "right",
    },
    {
      key: "unit_cost",
      header: "Unit Cost",
      cell: (r) => <span className="tabular-nums">{money(r.unit_cost)}</span>,
      align: "right",
    },
    {
      key: "total_cost",
      header: "Total",
      cell: (r) => <span className="tabular-nums font-medium">{money(r.total_cost)}</span>,
      align: "right",
    },
    {
      key: "location",
      header: "Location",
      cell: (r) => r.location ?? "—",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Moves"
        crumbs={[
          { label: "Master Data" },
          { label: "Stock Levels", to: "/inventory" },
          { label: "Stock Moves" },
        ]}
        description="All inventory movements — purchases, sales, adjustments, and returns."
        backTo="/inventory"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={productId}
          onValueChange={(v) => {
            setProductId(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[220px]" aria-label="Filter by product">
            <SelectValue placeholder="All products" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All products</SelectItem>
            {(productsQuery.data?.products ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={type}
          onValueChange={(v) => {
            setType(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]" aria-label="Filter by type">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            <SelectItem value="purchase">Purchase</SelectItem>
            <SelectItem value="sale">Sale</SelectItem>
            <SelectItem value="adjustment">Adjustment</SelectItem>
            <SelectItem value="return_in">Return In</SelectItem>
            <SelectItem value="return_out">Return Out</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            className="w-[150px]"
            aria-label="From date"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            className="w-[150px]"
            aria-label="To date"
          />
        </div>
      </div>

      {query.isLoading ? (
        <LoadingState label="Loading stock moves" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data && query.data.moves.length > 0 ? (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            rows={query.data.moves}
            rowKey={(r) => String(r.id)}
            caption="Stock Moves"
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
          title="No stock moves found"
          description="No inventory movements match your filters."
        />
      )}
    </div>
  );
}
