import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { RequireRole } from "@/components/guards/RouteGuards";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { reportsService } from "@/services/reportsService";
import { money, date } from "@/lib/format";
import { ReportHeader } from "@/components/reports/ReportLayout";

export const Route = createFileRoute("/_app/reports/aging-receivables")({
  head: () => ({
    meta: [
      { title: "AR Aging — Urban Furniture Accounting" },
      { name: "description", content: "Accounts Receivable Aging report." },
      { property: "og:title", content: "AR Aging — Urban Furniture Accounting" },
      { property: "og:description", content: "Accounts Receivable Aging report." },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin", "accountant"]}>
      <Page />
    </RequireRole>
  ),
});

const BUCKET_COLORS: Record<string, string> = {
  current: "text-emerald-600 bg-emerald-50",
  "1_30": "text-yellow-600 bg-yellow-50",
  "31_60": "text-orange-600 bg-orange-50",
  "61_90": "text-red-600 bg-red-50",
  "90_plus": "text-rose-800 bg-rose-100",
};

function Page() {
  const query = useQuery({
    queryKey: ["reports", "aging-receivables"],
    queryFn: () => reportsService.agingReceivables(),
  });

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Accounts Receivable Aging"
        subtitle="Outstanding customer invoices by age"
        actions={
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-1.5 size-3.5" aria-hidden />
            Print
          </Button>
        }
      />

      {query.isLoading ? <LoadingState label="Loading report" /> : null}
      {query.isError ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : null}

      {!query.isLoading && !query.isError && (!query.data || query.data.customers.length === 0) ? (
        <EmptyState title="No receivables" description="No outstanding customer invoices." />
      ) : null}

      {query.data ? (
        <>
          <p className="text-sm text-muted-foreground">
            As of <span className="font-medium text-foreground">{date(query.data.as_of_date)}</span>
          </p>

          <BucketSummaryTotals
            bucketTotals={query.data.bucket_totals}
            grandTotal={query.data.grand_total}
          />

          <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      Customer
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      Invoice
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      Due Date
                    </th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      Days Overdue
                    </th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      Current
                    </th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      1-30
                    </th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      31-60
                    </th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      61-90
                    </th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      90+
                    </th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      Total Due
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.customers.map((customer) =>
                    customer.invoices.map((inv, idx) => (
                      <tr
                        key={`${customer.contact_id}-${inv.invoice_id}`}
                        className="border-b last:border-0"
                      >
                        {idx === 0 ? (
                          <td
                            rowSpan={customer.invoices.length}
                            className="px-4 py-2.5 font-medium text-foreground align-top"
                          >
                            {customer.contact_name}
                          </td>
                        ) : null}
                        <td className="px-4 py-2.5 text-[13px] text-foreground">
                          {inv.invoice_number}
                        </td>
                        <td className="px-4 py-2.5 text-[13px] whitespace-nowrap">
                          {date(inv.due_date)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-[13px] tabular-nums">
                          {inv.days_overdue}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right text-[13px] tabular-nums font-medium ${BUCKET_COLORS.current}`}
                        >
                          {inv.bucket === "current" ? money(inv.amount_due) : "—"}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right text-[13px] tabular-nums font-medium ${BUCKET_COLORS["1_30"]}`}
                        >
                          {inv.bucket === "1_30" ? money(inv.amount_due) : "—"}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right text-[13px] tabular-nums font-medium ${BUCKET_COLORS["31_60"]}`}
                        >
                          {inv.bucket === "31_60" ? money(inv.amount_due) : "—"}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right text-[13px] tabular-nums font-medium ${BUCKET_COLORS["61_90"]}`}
                        >
                          {inv.bucket === "61_90" ? money(inv.amount_due) : "—"}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right text-[13px] tabular-nums font-medium ${BUCKET_COLORS["90_plus"]}`}
                        >
                          {inv.bucket === "90_plus" ? money(inv.amount_due) : "—"}
                        </td>
                        {idx === 0 ? (
                          <td
                            rowSpan={customer.invoices.length}
                            className="px-4 py-2.5 text-right text-[13px] font-semibold tabular-nums text-foreground align-top"
                          >
                            {money(customer.total_due)}
                          </td>
                        ) : null}
                      </tr>
                    )),
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/40">
                    <td colSpan={4} className="px-4 py-3 text-[13px] font-bold text-foreground">
                      Grand Total
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums text-foreground">
                      {money(query.data.bucket_totals.current)}
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums text-foreground">
                      {money(query.data.bucket_totals["1_30"])}
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums text-foreground">
                      {money(query.data.bucket_totals["31_60"])}
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums text-foreground">
                      {money(query.data.bucket_totals["61_90"])}
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums text-foreground">
                      {money(query.data.bucket_totals["90_plus"])}
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums text-foreground">
                      {money(query.data.grand_total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function BucketSummaryTotals({
  bucketTotals,
  grandTotal,
}: {
  bucketTotals: {
    current: number;
    "1_30": number;
    "31_60": number;
    "61_90": number;
    "90_plus": number;
  };
  grandTotal: number;
}) {
  const buckets = [
    { label: "Current", value: bucketTotals.current, color: "border-emerald-200 bg-emerald-50" },
    { label: "1-30 Days", value: bucketTotals["1_30"], color: "border-yellow-200 bg-yellow-50" },
    { label: "31-60 Days", value: bucketTotals["31_60"], color: "border-orange-200 bg-orange-50" },
    { label: "61-90 Days", value: bucketTotals["61_90"], color: "border-red-200 bg-red-50" },
    { label: "90+ Days", value: bucketTotals["90_plus"], color: "border-rose-200 bg-rose-50" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {buckets.map((b) => (
        <div key={b.label} className={`rounded-lg border p-4 shadow-sm ${b.color}`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
            {b.label}
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{money(b.value)}</p>
        </div>
      ))}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 shadow-sm sm:col-span-3 lg:col-span-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
          Grand Total
        </p>
        <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{money(grandTotal)}</p>
      </div>
    </div>
  );
}
