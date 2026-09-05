import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { RequireAuth } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, ErrorState } from "@/components/common/States";
import { FormSection, Field, FormGrid, FormActions, ErrorBanner } from "@/components/common/FormLayout";
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
      { name: "description", content: "Record invoice payment in the Urban Furniture Accounting System." },
      { property: "og:title", content: "Record invoice payment — Urban Furniture Accounting" },
      { property: "og:description", content: "Record invoice payment in the Urban Furniture Accounting System." },
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
    <div className="space-y-6">
      <PageHeader title="Record invoice payment" description={`Invoice ${invoice.invoice_number}`} />
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <FormSection title="Payment details">
          <ErrorBanner message={formError} />
          <FormGrid>
            <Field label="Total" htmlFor="total">
              <Input id="total" value={money(invoice.total)} readOnly disabled />
            </Field>
            <Field label="Amount due" htmlFor="amount_due">
              <Input id="amount_due" value={money(invoice.amount_due)} readOnly disabled />
            </Field>
            <Field label="Paid via" htmlFor="payment_via" required>
              <Select value={paymentVia} onValueChange={(v) => setPaymentVia(v as PaymentVia)}>
                <SelectTrigger id="payment_via"><SelectValue /></SelectTrigger>
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
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setAmountError(null);
                }}
                required
              />
            </Field>
          </FormGrid>
          <FormActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/invoices/$id", params: { id } })}
            >
              Back
            </Button>
            <Button type="submit" disabled={mutation.isPending || invoice.amount_due <= 0}>
              {mutation.isPending ? "Recording…" : "Pay"}
            </Button>
          </FormActions>
        </FormSection>
      </form>
    </div>
  );
}
