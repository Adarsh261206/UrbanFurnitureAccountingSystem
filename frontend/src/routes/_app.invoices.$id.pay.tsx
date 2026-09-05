import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { RequireAuth } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, ErrorState } from "@/components/common/States";
import { Field, ErrorBanner } from "@/components/common/FormLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { invoicesService } from "@/services/salesService";
import { errorMessage } from "@/lib/api/errors";
import { money, today } from "@/lib/format";
import type { PaymentVia } from "@/types/api";

export const Route = createFileRoute("/_app/invoices/$id/pay")({
  head: () => ({
    meta: [
      { title: "Record invoice payment — Urban Furniture Accounting" },
      {
        name: "description",
        content: "Record invoice payment in the Urban Furniture Accounting System.",
      },
      { property: "og:title", content: "Record invoice payment — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "Record invoice payment in the Urban Furniture Accounting System.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Page />
    </RequireAuth>
  ),
});

function Page() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [paymentVia, setPaymentVia] = useState<PaymentVia>("bank");
  const [paymentDate, setPaymentDate] = useState(today());
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["invoices", id],
    queryFn: () => invoicesService.get(id),
  });

  const mutation = useMutation({
    mutationFn: () =>
      invoicesService.pay(id, {
        amount: Number(amount),
        payment_via: paymentVia,
        payment_date: paymentDate,
      }),
    onSuccess: () => {
      toast.success("Payment recorded");
      navigate({ to: "/invoices/$id", params: { id } });
    },
    onError: (error) => {
      const message = errorMessage(error);
      if (message.toLowerCase().includes("payment") || message.toLowerCase().includes("due")) {
        setAmountError(message);
      } else {
        setFormError(message);
      }
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setAmountError(null);
    if (!invoice) return;
    const value = Number(amount);
    if (!amount || Number.isNaN(value) || value <= 0) {
      setAmountError("Enter an amount greater than zero");
      return;
    }
    if (value > invoice.amount_due) {
      setAmountError("Amount cannot exceed the amount due");
      return;
    }
    mutation.mutate();
  }

  if (query.isLoading) return <LoadingState label="Loading invoice" />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  const invoice = query.data;
  if (!invoice) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Record payment"
        crumbs={[
          { label: "Sales" },
          { label: "Invoices", to: "/invoices" },
          { label: invoice.invoice_number },
        ]}
        description="Record a customer payment against this invoice."
        actions={
          <Button
            variant="outline"
            onClick={() => navigate({ to: "/invoices/$id", params: { id } })}
          >
            Back
          </Button>
        }
      />
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-2 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Invoice
              </p>
              <p className="mt-1 text-lg font-bold text-foreground">{invoice.invoice_number}</p>
              <p className="text-[13px] text-muted-foreground">{invoice.customer?.name ?? "—"}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Amount due
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-primary">
                {money(invoice.amount_due)}
              </p>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-4 text-[13px] sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Total</dt>
              <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
                {money(invoice.total)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Invoice date</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {new Date(invoice.invoice_date).toLocaleDateString("en-IN")}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Due date</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {new Date(invoice.due_date).toLocaleDateString("en-IN")}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <ErrorBanner message={formError} />
          <h2 className="text-sm font-semibold text-foreground">Payment details</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Payment type" htmlFor="payment_type">
              <Input id="payment_type" value="Receive" readOnly disabled />
              <p className="text-xs text-muted-foreground">Receiving money from the customer.</p>
            </Field>
            <Field label="Partner" htmlFor="partner">
              <Input id="partner" value={invoice.customer?.name ?? "—"} readOnly disabled />
            </Field>
            <Field label="Paid via" htmlFor="payment_via" required>
              <Select value={paymentVia} onValueChange={(v) => setPaymentVia(v as PaymentVia)}>
                <SelectTrigger id="payment_via">
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
                required
              />
            </Field>
            <Field label="Amount" htmlFor="amount" required error={amountError}>
              <Input
                id="amount"
                type="number"
                min={0.01}
                step="0.01"
                max={invoice.amount_due}
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setAmountError(null);
                }}
                required
              />
            </Field>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/invoices/$id", params: { id } })}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || invoice.amount_due <= 0}>
              {mutation.isPending ? "Recording…" : "Pay"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
