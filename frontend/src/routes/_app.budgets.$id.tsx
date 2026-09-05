import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState, LoadingState } from "@/components/common/States";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { ErrorBanner, Field } from "@/components/common/FormLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { budgetsService } from "@/services/budgetsService";
import { errorMessage } from "@/lib/api/errors";
import { date as fmtDate, money, percent } from "@/lib/format";

export const Route = createFileRoute("/_app/budgets/$id")({
  head: () => ({
    meta: [
      { title: "Budget — Urban Furniture Accounting" },
      { name: "description", content: "Budget in the Urban Furniture Accounting System." },
      { property: "og:title", content: "Budget — Urban Furniture Accounting" },
      { property: "og:description", content: "Budget in the Urban Furniture Accounting System." },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin", "accountant"]}>
      <Page />
    </RequireRole>
  ),
});

function Page() {
  const { id } = useParams({ from: "/_app/budgets/$id" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [error, setError] = useState<string | null>(null);
  const [committedAmount, setCommittedAmount] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);

  const query = useQuery({ queryKey: ["budgets", id], queryFn: () => budgetsService.get(id) });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["budgets", id] });
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
  };

  const confirmMutation = useMutation({
    mutationFn: () => budgetsService.confirm(id, { committed_amount: Number(committedAmount) }),
    onSuccess: () => {
      toast.success("Budget confirmed");
      setError(null);
      invalidate();
    },
    onError: (e) => setError(errorMessage(e)),
  });

  const reviseMutation = useMutation({
    mutationFn: () => budgetsService.revise(id),
    onSuccess: (revised) => {
      toast.success("Budget revised");
      setError(null);
      invalidate();
      navigate({ to: "/budgets/$id", params: { id: revised.id } });
    },
    onError: (e) => setError(errorMessage(e)),
  });

  const cancelMutation = useMutation({
    mutationFn: () => budgetsService.cancel(id),
    onSuccess: () => {
      toast.success("Budget cancelled");
      setError(null);
      setCancelOpen(false);
      invalidate();
    },
    onError: (e) => {
      setError(errorMessage(e));
      setCancelOpen(false);
    },
  });

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Budget" />
        <LoadingState label="Loading budget" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Budget" />
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      </div>
    );
  }

  const budget = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={budget.name}
        description={`${budget.type === "income" ? "Income" : "Expense"} budget · ${budget.analytical?.name ?? "—"}`}
        actions={<StatusBadge status={budget.status} />}
      />

      <ErrorBanner message={error} />

      <div className="grid gap-4 rounded-lg border bg-card shadow-sm p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Detail label="Responsible" value={budget.responsible?.name ?? "—"} />
        <Detail label="Analytical account" value={budget.analytical?.name ?? "—"} />
        <Detail label="Start date" value={fmtDate(budget.start_date)} />
        <Detail label="End date" value={fmtDate(budget.end_date)} />
        <Detail label="Committed amount" value={money(budget.committed_amount)} />
        <Detail label="Achieved amount" value={money(budget.achieved_amount)} />
        <Detail label="Achieved %" value={percent(budget.achieved_percentage)} />
        <Detail label="Amount to achieve" value={money(budget.amount_to_achieve)} />
      </div>

      {budget.status === "confirmed" || budget.status === "revised" ? (
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-medium text-foreground">Achievement</span>
            <span className="font-semibold tabular-nums text-foreground">
              {money(budget.achieved_amount)} / {money(budget.committed_amount)}{" "}
              <span className="ml-1 text-muted-foreground">
                ({percent(budget.achieved_percentage)})
              </span>
            </span>
          </div>
          <Progress
            value={Math.min(100, Math.max(0, budget.achieved_percentage ?? 0))}
            className="mt-3 h-2"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card shadow-sm p-5">
        {budget.status === "draft" ? (
          <>
            <Field label="Committed amount" htmlFor="committed_amount" required className="w-56">
              <Input
                id="committed_amount"
                type="number"
                min="0"
                step="0.01"
                value={committedAmount}
                onChange={(e) => setCommittedAmount(e.target.value)}
              />
            </Field>
            <Button
              disabled={
                !committedAmount || Number(committedAmount) < 0 || confirmMutation.isPending
              }
              onClick={() => confirmMutation.mutate()}
            >
              {confirmMutation.isPending ? "Confirming…" : "Confirm"}
            </Button>
          </>
        ) : null}

        {budget.status === "confirmed" ? (
          <Button
            variant="outline"
            disabled={reviseMutation.isPending}
            onClick={() => reviseMutation.mutate()}
          >
            {reviseMutation.isPending ? "Revising…" : "Revise"}
          </Button>
        ) : null}

        {budget.status !== "cancelled" ? (
          <Button variant="destructive" onClick={() => setCancelOpen(true)}>
            Cancel budget
          </Button>
        ) : null}
      </div>

      <ConfirmationModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this budget?"
        description="This will mark the budget as cancelled. This action cannot be undone."
        confirmLabel="Cancel budget"
        destructive
        pending={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
