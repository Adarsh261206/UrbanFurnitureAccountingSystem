import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { RequireRole } from "@/components/guards/RouteGuards";
import { LoadingState, ErrorState } from "@/components/common/States";
import { reportsService } from "@/services/reportsService";
import { BackToDashboardButton, PrintReportButton } from "@/components/reports/ReportActions";
import {
  ReportHeader,
  YearSelect,
  FinancialStatementTable,
  CashFlowSummary,
} from "@/components/reports/ReportLayout";

export const Route = createFileRoute("/_app/reports/cash-flow")({
  head: () => ({
    meta: [
      { title: "Cash flow statement — Urban Furniture Accounting" },
      {
        name: "description",
        content: "Cash flow statement in the Urban Furniture Accounting System.",
      },
      { property: "og:title", content: "Cash flow statement — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "Cash flow statement in the Urban Furniture Accounting System.",
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
    queryKey: ["reports", "cash-flow", year],
    queryFn: () => reportsService.cashFlow({ year }),
  });

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Cash Flow Statement"
        subtitle={`For the financial year ${year}`}
        actions={
          <>
            <BackToDashboardButton />
            <YearSelect value={year} onChange={setYear} />
            <PrintReportButton
              fetchPdf={() => reportsService.cashFlowPdf({ year })}
              fileName={`cash-flow-statement-${year}.pdf`}
            />
          </>
        }
      />

      {query.isLoading ? <LoadingState label="Loading report" /> : null}
      {query.isError ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : null}

      {query.data ? (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <FinancialStatementTable
              title="Operating Activities"
              items={query.data.operating.items.map((i) => ({
                account_name: i.description,
                amount: i.amount,
              }))}
              total={query.data.operating.total}
            />
            <FinancialStatementTable
              title="Investing Activities"
              items={query.data.investing.items.map((i) => ({
                account_name: i.description,
                amount: i.amount,
              }))}
              total={query.data.investing.total}
            />
            <FinancialStatementTable
              title="Financing Activities"
              items={query.data.financing.items.map((i) => ({
                account_name: i.description,
                amount: i.amount,
              }))}
              total={query.data.financing.total}
            />
          </div>
          <CashFlowSummary
            net_change={query.data.net_change}
            opening_balance={query.data.opening_balance}
            closing_balance={query.data.closing_balance}
          />
        </div>
      ) : null}
    </div>
  );
}
