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
  BalanceCheck,
} from "@/components/reports/ReportLayout";

export const Route = createFileRoute("/_app/reports/balance-sheet")({
  head: () => ({
    meta: [
      { title: "Balance sheet — Urban Furniture Accounting" },
      { name: "description", content: "Balance sheet in the Urban Furniture Accounting System." },
      { property: "og:title", content: "Balance sheet — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "Balance sheet in the Urban Furniture Accounting System.",
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
    queryKey: ["reports", "balance-sheet", year],
    queryFn: () => reportsService.balanceSheet({ year }),
  });

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Balance Sheet"
        subtitle={`As at financial year ${year}`}
        actions={
          <>
            <BackToDashboardButton />
            <YearSelect value={year} onChange={setYear} />
            <PrintReportButton
              fetchPdf={() => reportsService.balanceSheetPdf({ year })}
              fileName={`balance-sheet-${year}.pdf`}
            />
          </>
        }
      />

      {query.isLoading ? <LoadingState label="Loading report" /> : null}
      {query.isError ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : null}

      {query.data ? (
        <div className="space-y-6">
          <FinancialStatementTable
            title="Assets"
            items={query.data.assets.items}
            total={query.data.assets.total}
          />
          <FinancialStatementTable
            title="Liabilities"
            items={query.data.liabilities.items}
            total={query.data.liabilities.total}
          />
          <BalanceCheck balanced={query.data.balance_check} />
        </div>
      ) : null}
    </div>
  );
}
