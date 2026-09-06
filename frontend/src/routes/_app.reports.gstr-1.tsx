import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { RequireRole } from "@/components/guards/RouteGuards";
import { LoadingState, ErrorState } from "@/components/common/States";
import { reportsService } from "@/services/reportsService";
import { BackToDashboardButton, PrintReportButton } from "@/components/reports/ReportActions";
import { ReportHeader } from "@/components/reports/ReportLayout";
import { money } from "@/lib/format";

export const Route = createFileRoute("/_app/reports/gstr-1")({
  head: () => ({
    meta: [
      { title: "GSTR-1 — Urban Furniture Accounting" },
      { name: "description", content: "GSTR-1 Outward Supplies report." },
      { property: "og:title", content: "GSTR-1 — Urban Furniture Accounting" },
      { property: "og:description", content: "GSTR-1 Outward Supplies report." },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin", "accountant"]}>
      <Page />
    </RequireRole>
  ),
});

const now = new Date();
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function Page() {
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const query = useQuery({
    queryKey: ["reports", "gstr-1", year, month],
    queryFn: () => reportsService.gstr1({ year, month }),
  });

  return (
    <div className="space-y-6">
      <ReportHeader
        title="GSTR-1 — Outward Supplies"
        subtitle={`Period: ${year}-${String(month).padStart(2, "0")}`}
        actions={
          <>
            <BackToDashboardButton />
            <label className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Month</span>
              <select
                aria-label="Month"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="h-9 rounded-md border border-input bg-card px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
              >
                {MONTHS.map((m, i) => (
                  <option key={i + 1} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Year</span>
              <select
                aria-label="Year"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="h-9 rounded-md border border-input bg-card px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
              >
                {Array.from({ length: 6 }, (_, i) => now.getFullYear() - i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <PrintReportButton
              fetchPdf={() => reportsService.gstr1Pdf({ year, month })}
              fileName={`gstr-1-${year}-${String(month).padStart(2, "0")}.pdf`}
            />
          </>
        }
      />

      {query.isLoading ? <LoadingState label="Loading GSTR-1 report" /> : null}
      {query.isError ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : null}

      {query.data ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <SummaryCard label="Invoices" value={String(query.data.summary.total_invoices)} />
            <SummaryCard
              label="Taxable Value"
              value={money(query.data.summary.total_taxable_value)}
            />
            <SummaryCard label="IGST" value={money(query.data.summary.total_igst)} />
            <SummaryCard label="CGST" value={money(query.data.summary.total_cgst)} />
            <SummaryCard label="SGST" value={money(query.data.summary.total_sgst)} />
          </div>

          <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
            <header className="border-b bg-muted/40 px-5 py-3">
              <h2 className="text-sm font-semibold text-foreground">Invoice Details</h2>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      Invoice No
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      Date
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      Customer
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      GSTIN
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      Supply
                    </th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      Taxable
                    </th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      IGST
                    </th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      CGST
                    </th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      SGST
                    </th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.invoices.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-5 py-8 text-center text-[13px] text-muted-foreground"
                      >
                        No invoices for this period.
                      </td>
                    </tr>
                  ) : (
                    query.data.invoices.map((inv) => (
                      <tr key={inv.invoice_id} className="border-b last:border-0">
                        <td className="px-4 py-2.5 text-[13px] font-medium text-foreground">
                          {inv.invoice_number}
                        </td>
                        <td className="px-4 py-2.5 text-[13px] whitespace-nowrap">{inv.date}</td>
                        <td className="px-4 py-2.5 text-[13px]">{inv.customer_name}</td>
                        <td className="px-4 py-2.5 text-[13px] font-mono text-xs">
                          {inv.customer_gstin || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-[13px]">{inv.place_of_supply}</td>
                        <td className="px-4 py-2.5 text-right text-[13px] tabular-nums">
                          {money(inv.taxable_value)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-[13px] tabular-nums">
                          {money(inv.igst)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-[13px] tabular-nums">
                          {money(inv.cgst)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-[13px] tabular-nums">
                          {money(inv.sgst)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-[13px] font-semibold tabular-nums">
                          {money(inv.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {query.data.invoices.length > 0 ? (
                  <tfoot>
                    <tr className="border-t-2 border-border bg-muted/40">
                      <td colSpan={5} className="px-4 py-3 text-[13px] font-bold text-foreground">
                        Total
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums">
                        {money(query.data.summary.total_taxable_value)}
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums">
                        {money(query.data.summary.total_igst)}
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums">
                        {money(query.data.summary.total_cgst)}
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums">
                        {money(query.data.summary.total_sgst)}
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums">
                        {money(query.data.invoices.reduce((s, i) => s + i.total, 0))}
                      </td>
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>
          </section>

          {query.data.hsn_summary.length > 0 ? (
            <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
              <header className="border-b bg-muted/40 px-5 py-3">
                <h2 className="text-sm font-semibold text-foreground">HSN Summary</h2>
              </header>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                        HSN Code
                      </th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                        Description
                      </th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                        UQC
                      </th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                        Qty
                      </th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                        Value
                      </th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                        Taxable
                      </th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                        IGST
                      </th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                        CGST
                      </th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                        SGST
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data.hsn_summary.map((h) => (
                      <tr key={h.hsn_code} className="border-b last:border-0">
                        <td className="px-4 py-2.5 text-[13px] font-medium text-foreground">
                          {h.hsn_code}
                        </td>
                        <td className="px-4 py-2.5 text-[13px]">{h.description}</td>
                        <td className="px-4 py-2.5 text-[13px]">{h.uqc}</td>
                        <td className="px-4 py-2.5 text-right text-[13px] tabular-nums">
                          {h.total_quantity}
                        </td>
                        <td className="px-4 py-2.5 text-right text-[13px] tabular-nums">
                          {money(h.total_value)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-[13px] tabular-nums">
                          {money(h.taxable_value)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-[13px] tabular-nums">
                          {money(h.igst)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-[13px] tabular-nums">
                          {money(h.cgst)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-[13px] tabular-nums">
                          {money(h.sgst)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
