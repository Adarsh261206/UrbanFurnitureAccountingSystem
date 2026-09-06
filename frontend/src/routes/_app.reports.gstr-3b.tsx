import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { RequireRole } from "@/components/guards/RouteGuards";
import { LoadingState, ErrorState } from "@/components/common/States";
import { reportsService } from "@/services/reportsService";
import { BackToDashboardButton, PrintReportButton } from "@/components/reports/ReportActions";
import { ReportHeader } from "@/components/reports/ReportLayout";
import { money } from "@/lib/format";

export const Route = createFileRoute("/_app/reports/gstr-3b")({
  head: () => ({
    meta: [
      { title: "GSTR-3B — Urban Furniture Accounting" },
      { name: "description", content: "GSTR-3B Summary Return report." },
      { property: "og:title", content: "GSTR-3B — Urban Furniture Accounting" },
      { property: "og:description", content: "GSTR-3B Summary Return report." },
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
    queryKey: ["reports", "gstr-3b", year, month],
    queryFn: () => reportsService.gstr3b({ year, month }),
  });

  return (
    <div className="space-y-6">
      <ReportHeader
        title="GSTR-3B — Summary Return"
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
              fetchPdf={() => reportsService.gstr3bPdf({ year, month })}
              fileName={`gstr-3b-${year}-${String(month).padStart(2, "0")}.pdf`}
            />
          </>
        }
      />

      {query.isLoading ? <LoadingState label="Loading GSTR-3B report" /> : null}
      {query.isError ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : null}

      {query.data ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Taxable Outward" value={money(query.data["3_1"].taxable_outward)} />
            <SummaryCard label="Inter-State" value={money(query.data["3_2"].inter_state)} />
            <SummaryCard label="Intra-State" value={money(query.data["3_2"].intra_state)} />
            <SummaryCard
              label="Total Tax Payable"
              value={money(query.data["6"].total_tax_payable)}
              highlight
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionTable
              title="3.1 — Outward Supplies"
              rows={[
                { label: "Taxable outward supplies", value: query.data["3_1"].taxable_outward },
                { label: "Zero rated supplies", value: query.data["3_1"].zero_rated },
                { label: "Deemed exports", value: query.data["3_1"].deemed_exports },
                { label: "Reverse charge", value: query.data["3_1"].reverse_charge },
                {
                  label: "Total outward supplies",
                  value: query.data["3_1"].total_outward,
                  total: true,
                },
              ]}
            />
            <SectionTable
              title="3.2 — Interstate/Intrastate"
              rows={[
                { label: "Inter-state supplies", value: query.data["3_2"].inter_state },
                { label: "Intra-state supplies", value: query.data["3_2"].intra_state },
              ]}
            />
            <SectionTable
              title="4 — Tax Liability"
              rows={[
                { label: "IGST", value: query.data["4"].total_igst },
                { label: "CGST", value: query.data["4"].total_cgst },
                { label: "SGST", value: query.data["4"].total_sgst },
                { label: "Cess", value: query.data["4"].total_cess },
                {
                  label: "Total Tax Liability",
                  value:
                    query.data["4"].total_igst +
                    query.data["4"].total_cgst +
                    query.data["4"].total_sgst +
                    query.data["4"].total_cess,
                  total: true,
                },
              ]}
            />
            <SectionTable
              title="5 — Input Tax Credit"
              rows={[
                { label: "Eligible ITC — IGST", value: query.data["5"].eligible_itc_igst },
                { label: "Eligible ITC — CGST", value: query.data["5"].eligible_itc_cgst },
                { label: "Eligible ITC — SGST", value: query.data["5"].eligible_itc_sgst },
                { label: "Ineligible ITC", value: query.data["5"].ineligible_itc },
                {
                  label: "Total Eligible ITC",
                  value:
                    query.data["5"].eligible_itc_igst +
                    query.data["5"].eligible_itc_cgst +
                    query.data["5"].eligible_itc_sgst,
                  total: true,
                },
              ]}
            />
          </div>

          <SectionTable
            title="6 — Payment of Tax"
            rows={[
              { label: "Tax payable — IGST", value: query.data["6"].tax_payable_igst },
              { label: "Tax payable — CGST", value: query.data["6"].tax_payable_cgst },
              { label: "Tax payable — SGST", value: query.data["6"].tax_payable_sgst },
              { label: "Interest", value: query.data["6"].interest },
              { label: "Late fee", value: query.data["6"].late_fee },
              { label: "Total Tax Payable", value: query.data["6"].total_tax_payable, total: true },
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 shadow-sm ${highlight ? "border-primary/25 bg-primary/5" : "bg-card"}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 text-lg font-bold tabular-nums ${highlight ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}

function SectionTable({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: number; total?: boolean }[];
}) {
  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <header className="border-b bg-muted/40 px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </header>
      <div className="divide-y">
        {rows.map((r) => (
          <div
            key={r.label}
            className={`flex items-center justify-between px-5 py-2.5 ${r.total ? "bg-muted/40" : ""}`}
          >
            <span className={`text-[13px] ${r.total ? "font-semibold" : ""} text-foreground`}>
              {r.label}
            </span>
            <span
              className={`text-[13px] tabular-nums ${r.total ? "font-bold" : ""} text-foreground`}
            >
              {money(r.value)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
