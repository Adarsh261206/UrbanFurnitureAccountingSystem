import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, ErrorState } from "@/components/common/States";
import { reportsService } from "@/services/reportsService";
import { money } from "@/lib/format";
import { BackToDashboardButton, PrintReportButton } from "@/components/reports/ReportActions";


export const Route = createFileRoute("/_app/reports/profit-and-loss")({
  head: () => ({
    meta: [
      { title: "Profit and loss — Urban Furniture Accounting" },
      { name: "description", content: "Profit and loss in the Urban Furniture Accounting System." },
      { property: "og:title", content: "Profit and loss — Urban Furniture Accounting" },
      { property: "og:description", content: "Profit and loss in the Urban Furniture Accounting System." },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin", "accountant"]}>
      <Page />
    </RequireRole>
  ),
});

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - i);

function Page() {
  const [year, setYear] = useState(currentYear);
  const query = useQuery({
    queryKey: ["reports", "profit-and-loss", year],
    queryFn: () => reportsService.profitAndLoss({ year }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profit and loss"
        description="Income and expenses for the selected financial year."
        actions={
          <>
          <BackToDashboardButton />
          <select
            aria-label="Financial year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <PrintReportButton
            fetchPdf={() => reportsService.profitAndLossPdf({ year })}
            fileName={`profit-and-loss-${year}.pdf`}
          />
          </>
        }
      />

      {query.isLoading ? (
        <LoadingState label="Loading report" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data ? (
        <div className="space-y-6 print:text-black">
          <ReportTable title="Income" items={query.data.income.items} total={query.data.income.total} />
          <ReportTable title="Expenses" items={query.data.expenses.items} total={query.data.expenses.total} />
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-6">
            <span className="text-base font-semibold text-foreground">Net income</span>
            <span
              className={
                query.data.net_income >= 0
                  ? "text-xl font-bold text-emerald-600 dark:text-emerald-400"
                  : "text-xl font-bold text-destructive"
              }
            >
              {money(query.data.net_income)}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReportTable({
  title,
  items,
  total,
}: {
  title: string;
  items: { account_name: string; amount: number }[];
  total: number;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">{title}</th>
            <th className="px-4 py-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={2} className="px-4 py-4 text-center text-muted-foreground">
                No {title.toLowerCase()} recorded for this year.
              </td>
            </tr>
          ) : (
            items.map((item, index) => (
              <tr key={`${item.account_name}-${index}`} className="border-t border-border">
                <td className="px-4 py-3">{item.account_name}</td>
                <td className="px-4 py-3 text-right tabular-nums">{money(item.amount)}</td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr className="border-t border-border bg-muted/30">
            <td className="px-4 py-3 text-right font-semibold">Total {title}</td>
            <td className="px-4 py-3 text-right font-semibold">{money(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
