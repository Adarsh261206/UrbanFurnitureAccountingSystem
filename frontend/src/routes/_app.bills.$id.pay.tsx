import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, ErrorState } from "@/components/common/States";
import { Field, ErrorBanner } from "@/components/common/FormLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { billsService } from "@/services/purchaseService";
import { errorMessage } from "@/lib/api/errors";
import { money, today } from "@/lib/format";
import type { PaymentVia } from "@/types/api";

export const Route = createFileRoute("/_app/bills/$id/pay")({
  head: () => ({
    meta: [
      { title: "Record bill payment — Urban Furniture Accounting" },
      {
        name: "description",
        content: "Record bill payment in the Urban Furniture Accounting System.",
      },
      { property: "og:title", content: "Record bill payment — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "Record bill payment in the Urban Furniture Accounting System.",
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
  const [amount, setAmount] = useState("");
  const [paymentVia, setPaymentVia] = useState<PaymentVia>("bank");
  const [paymentDate, setPaymentDate] = useState(today());
  const [formError, setFormError] = useState<string | null>(null);

  const billQuery = useQuery({ queryKey: ["bill", id], queryFn: () => billsService.get(id) });

  const payMutation = useMutation({
    mutationFn: () =>
      billsService.pay(id, {
        amount: Number(amount),
        payment_via: paymentVia,
        payment_date: paymentDate,
      }),
    onSuccess: () => {
      toast.success("Payment recorded");
      void navigate({ to: "/bills/$id", params: { id } });
    },
    onError: (error) => setFormError(errorMessage(error)),
  });

  if (billQuery.isLoading) return <LoadingState label="Loading bill" />;
  if (billQuery.isError)
    return <ErrorState error={billQuery.error} onRetry={() => billQuery.refetch()} />;
  const bill = billQuery.data;
  if (!bill) return null;

  const numericAmount = Number(amount);
  const canSubmit =
    amount !== "" && numericAmount > 0 && numericAmount <= bill.amount_due && paymentDate;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={`Record payment`}
        crumbs={[
          { label: "Purchase" },
          { label: "Bills", to: "/bills" },
          { label: bill.bill_reference },
        ]}
        description="Record a vendor payment against this bill."
        actions={
          <Button variant="outline" onClick={() => navigate({ to: "/bills/$id", params: { id } })}>
            Back
          </Button>
        }
      />

      <ErrorBanner message={formError} />

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-2 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Bill
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">{bill.bill_reference}</p>
            <p className="text-[13px] text-muted-foreground">{bill.vendor?.name ?? "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Amount due
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-primary">
              {money(bill.amount_due)}
            </p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 text-[13px] sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Total</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
              {money(bill.total)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Bill date</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {new Date(bill.bill_date).toLocaleDateString("en-IN")}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Due date</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {new Date(bill.due_date).toLocaleDateString("en-IN")}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Payment details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Payment type" htmlFor="payment_type">
            <Input id="payment_type" value="Send" readOnly disabled />
            <p className="text-xs text-muted-foreground">Sending money out to the vendor.</p>
          </Field>
          <Field label="Partner" htmlFor="partner">
            <Input id="partner" value={bill.vendor?.name ?? "—"} readOnly disabled />
          </Field>
          <Field label="Amount" htmlFor="amount" required>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              max={bill.amount_due}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <Field label="Payment via" htmlFor="payment_via" required>
            <Select value={paymentVia} onValueChange={(v) => setPaymentVia(v as PaymentVia)}>
              <SelectTrigger id="payment_via" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Payment date" htmlFor="payment_date" required>
            <Input
              id="payment_date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t pt-5">
          <Button variant="outline" onClick={() => navigate({ to: "/bills/$id", params: { id } })}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit || payMutation.isPending}
            onClick={() => payMutation.mutate()}
          >
            {payMutation.isPending ? "Recording…" : "Record payment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
