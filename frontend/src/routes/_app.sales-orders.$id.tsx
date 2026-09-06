import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2, Circle, Plus } from "lucide-react";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, ErrorState } from "@/components/common/States";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { salesOrdersService } from "@/services/salesService";
import { budgetsService } from "@/services/budgetsService";
import { errorMessage } from "@/lib/api/errors";
import { date, money } from "@/lib/format";
import type { SalesOrderDetail } from "@/types/api";
import { useBudgetWarnings } from "@/components/accounting/useBudgetWarnings";
import { BudgetWarningBanner } from "@/components/accounting/BudgetWarningBanner";

export const Route = createFileRoute("/_app/sales-orders/$id")({
  head: () => ({
    meta: [
      { title: "Sales order — Urban Furniture Accounting" },
      {
        name: "description",
        content: "Sales order detail in the Urban Furniture Accounting System.",
      },
      { property: "og:title", content: "Sales order — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "Sales order in the Urban Furniture Accounting System.",
      },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin", "accountant"]}>
      <Page />
    </RequireRole>
  ),
});

function Page() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["sales-order", id],
    queryFn: () => salesOrdersService.get(id),
  });

  const budgetsQuery = useQuery({
    queryKey: ["budgets", "warning-check"],
    queryFn: () => budgetsService.list({ limit: 200 }),
  });

  const warnings = useBudgetWarnings(query.data?.lines ?? [], budgetsQuery.data?.budgets ?? []);

  const confirmMutation = useMutation({
    mutationFn: () => salesOrdersService.confirm(id),
    onSuccess: () => {
      toast.success("Sales order confirmed successfully");
      void queryClient.invalidateQueries({ queryKey: ["sales-order", id] });
      void queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
    },
    onError: (error) => setActionError(errorMessage(error)),
  });

  const so = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={so ? `Sales Order ${so.so_number}` : "Sales order"}
        backTo="/sales-orders"
        crumbs={[{ label: "Sales" }, { label: "Sales Orders", to: "/sales-orders" }]}
        description={so?.customer?.name}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate({ to: "/sales-orders/new" })}>
              <Plus className="size-4" /> New
            </Button>
            {so?.status === "draft" ? (
              <Button disabled={confirmMutation.isPending} onClick={() => confirmMutation.mutate()}>
                {confirmMutation.isPending ? "Confirming…" : "Confirm"}
              </Button>
            ) : null}
            {so?.status === "confirmed" ? (
              <Button
                onClick={() =>
                  navigate({
                    to: "/invoices/new",
                    search: { so: so.id },
                  })
                }
              >
                Create Invoice
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => navigate({ to: "/sales-orders" })}>
              Back
            </Button>
          </>
        }
      />

      {actionError ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive"
        >
          {actionError}
        </p>
      ) : null}

      {query.isLoading ? <LoadingState label="Loading sales order" /> : null}
      {query.isError ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : null}

      {so ? (
        <>
          <SalesOrderWorkflowStrip so={so} />

          {warnings.length > 0 ? <BudgetWarningBanner warnings={warnings} /> : null}

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-lg border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      Sales order
                    </p>
                    <h2 className="mt-1 text-base font-bold text-foreground">{so.so_number}</h2>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                      {so.customer?.name ?? "—"}
                    </p>
                  </div>
                  <StatusBadge status={so.status} />
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      SO date
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">{date(so.order_date)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      Customer
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">{so.customer_name}</dd>
                  </div>
                </dl>
              </div>

              <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                <header className="border-b bg-muted/40 px-5 py-3">
                  <h2 className="text-sm font-semibold text-foreground">Order lines</h2>
                </header>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                          #
                        </th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                          Product
                        </th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                          Analytical
                        </th>
                        <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                          Qty
                        </th>
                        <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                          Unit price
                        </th>
                        <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {so.lines.map((line) => (
                        <tr key={line.id} className="border-b last:border-0">
                          <td className="px-4 py-2.5 text-muted-foreground">{line.sr_no}</td>
                          <td className="px-4 py-2.5 font-medium text-foreground">
                            {line.product_name ?? line.product_id}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {line.budget_analytic_id ?? "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{line.qty}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">
                            {money(line.unit_price)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                            {money(line.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border bg-muted/40">
                        <td
                          colSpan={5}
                          className="px-4 py-3 text-right text-[13px] font-semibold text-foreground"
                        >
                          Grand total
                        </td>
                        <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums text-foreground">
                          {money(so.total_amount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border bg-card p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-foreground">Summary</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Total</dt>
                    <dd className="font-semibold tabular-nums text-foreground">
                      {money(so.total_amount)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function SalesOrderWorkflowStrip({ so }: { so: SalesOrderDetail }) {
  const steps = [
    { label: "Sales order", done: true },
    { label: "Confirmed", done: so.status !== "draft" },
    { label: "Invoice", done: so.status === "confirmed" && !!so.lines.length },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-4 py-3 shadow-sm">
      {steps.map((step, idx) => (
        <div key={step.label} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            {step.done ? (
              <CheckCircle2 className="size-4 text-success" aria-hidden />
            ) : (
              <Circle className="size-4 text-muted-foreground" aria-hidden />
            )}
            <span
              className={
                step.done
                  ? "text-[13px] font-medium text-foreground"
                  : "text-[13px] text-muted-foreground"
              }
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 ? <span className="text-muted-foreground">→</span> : null}
        </div>
      ))}
    </div>
  );
}
