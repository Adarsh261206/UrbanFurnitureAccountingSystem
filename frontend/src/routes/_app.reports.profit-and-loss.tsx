import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { TrendingDown, TrendingUp } from "lucide-react";
import { RequireRole } from "@/components/guards/RouteGuards";
import { LoadingState, ErrorState } from "@/components/common/States";
import { reportsService } from "@/services/reportsService";
import { BackToDashboardButton, PrintReportButton } from "@/components/reports/ReportActions";
import {
  ReportHeader,
  YearSelect,
  FinancialStatementTable,
} from "@/components/reports/ReportLayout";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/reports/profit-and-loss")({
  head: () => ({
    meta: [
      { title: "Profit and loss — Urban Furniture Accounting" },
      { name: "description", content: "Profit and loss in the Urban Furniture Accounting System." },
      { property: "og:title", content: "Profit and loss — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "Profit and loss in the Urban Furniture Accounting System.",
      },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin", "accountant"]}>
      <Page />
    </RequireRole>
  ),
});

const currentYear = new Date().getFullYear();

function Page() {
  const [year, setYear] = useState(currentYear);
  const query = useQuery({
    queryKey: ["reports", "profit-and-loss", year],
    queryFn: () => reportsService.profitAndLoss({ year }),
  });

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Profit and Loss"
        subtitle={`For the financial year ${year}`}
        actions={
          <>
            <BackToDashboardButton />
            <YearSelect value={year} onChange={setYear} />
            <PrintReportButton
              fetchPdf={() => reportsService.profitAndLossPdf({ year })}
              fileName={`profit-and-loss-${year}.pdf`}
            />
          </>
        }
      />

      {query.isLoading ? <LoadingState label="Loading report" /> : null}
      {query.isError ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : null}

      {query.data ? (
        <div className="space-y-6">
          <FinancialStatementTable
            title="Income"
            items={query.data.income.items}
            total={query.data.income.total}
          />
          <FinancialStatementTable
            title="Expenses"
            items={query.data.expenses.items}
            total={query.data.expenses.total}
          />
          <section
            className={cn(
              "flex items-center justify-between rounded-lg border px-5 py-4",
              query.data.net_income >= 0
                ? "border-success/25 bg-success/[0.04]"
                : "border-destructive/25 bg-destructive/[0.04]",
            )}
          >
            <span className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
              {query.data.net_income >= 0 ? (
                <TrendingUp className="size-5 text-success" aria-hidden />
              ) : (
                <TrendingDown className="size-5 text-destructive" aria-hidden />
              )}
              Net income
            </span>
            <span
              className={cn(
                "text-xl font-bold tabular-nums",
                query.data.net_income >= 0 ? "text-success" : "text-destructive",
              )}
            >
              {money(query.data.net_income)}
            </span>
          </section>
        </div>
      ) : null}
    </div>
  );
}
