import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, XCircle } from "lucide-react";
import { RequireRole } from "@/components/guards/RouteGuards";
import { LoadingState, ErrorState } from "@/components/common/States";
import { reportsService } from "@/services/reportsService";
import { BackToDashboardButton, PrintReportButton } from "@/components/reports/ReportActions";
import { ReportHeader, YearSelect } from "@/components/reports/ReportLayout";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/reports/trial-balance")({
  head: () => ({
    meta: [
      { title: "Trial Balance — Urban Furniture Accounting" },
      { name: "description", content: "Trial balance in the Urban Furniture Accounting System." },
      { property: "og:title", content: "Trial Balance — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "Trial balance in the Urban Furniture Accounting System.",
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
    queryKey: ["reports", "trial-balance", year],
    queryFn: () => reportsService.trialBalance({ year }),
  });

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Trial Balance"
        subtitle={`As at financial year ${year}`}
        actions={
          <>
            <BackToDashboardButton />
            <YearSelect value={year} onChange={setYear} />
            <PrintReportButton
              fetchPdf={() => reportsService.trialBalancePdf({ year })}
              fileName={`trial-balance-${year}.pdf`}
            />
          </>
        }
      />

      {query.isLoading ? <LoadingState label="Loading report" /> : null}
      {query.isError ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : null}

      {query.data ? (
        <div className="space-y-6">
          <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      Account
                    </th>
                    <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      Type
                    </th>
                    <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      Debit
                    </th>
                    <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      Credit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.accounts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-8 text-center text-[13px] text-muted-foreground"
                      >
                        No journal entries recorded for this year.
                      </td>
                    </tr>
                  ) : (
                    query.data.accounts.map((account, index) => (
                      <tr key={`${account.account_id}-${index}`} className="border-b last:border-0">
                        <td className="px-5 py-2.5 text-[13px] text-foreground">
                          {account.account_name}
                        </td>
                        <td className="px-5 py-2.5 text-[13px] capitalize text-muted-foreground">
                          {account.account_type}
                        </td>
                        <td className="px-5 py-2.5 text-right text-[13px] tabular-nums text-foreground">
                          {account.debit > 0 ? money(account.debit) : ""}
                        </td>
                        <td className="px-5 py-2.5 text-right text-[13px] tabular-nums text-foreground">
                          {account.credit > 0 ? money(account.credit) : ""}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/40">
                    <td colSpan={2} className="px-5 py-3 text-[13px] font-semibold text-foreground">
                      Total
                    </td>
                    <td className="px-5 py-3 text-right text-[13px] font-bold tabular-nums text-foreground">
                      {money(query.data.total_debit)}
                    </td>
                    <td className="px-5 py-3 text-right text-[13px] font-bold tabular-nums text-foreground">
                      {money(query.data.total_credit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <div
            className={cn(
              "flex items-center justify-between rounded-lg border px-5 py-4",
              query.data.is_balanced
                ? "border-success/25 bg-success/[0.04]"
                : "border-destructive/25 bg-destructive/[0.04]",
            )}
          >
            <span className="text-sm font-semibold text-foreground">Status</span>
            <span
              className={cn(
                "flex items-center gap-2 text-[15px] font-bold",
                query.data.is_balanced ? "text-success" : "text-destructive",
              )}
            >
              {query.data.is_balanced ? (
                <>
                  <CheckCircle2 className="size-5" aria-hidden /> Balanced
                </>
              ) : (
                <>
                  <XCircle className="size-5" aria-hidden /> Not Balanced
                </>
              )}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
