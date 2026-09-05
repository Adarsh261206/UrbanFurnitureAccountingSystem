import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, ErrorState } from "@/components/common/States";
import { FormSection, Field, FormActions, ErrorBanner } from "@/components/common/FormLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
      { name: "description", content: "Record bill payment in the Urban Furniture Accounting System." },
      { property: "og:title", content: "Record bill payment — Urban Furniture Accounting" },
      { property: "og:description", content: "Record bill payment in the Urban Furniture Accounting System." },
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
      billsService.pay(id, { amount: Number(amount), payment_via: paymentVia, payment_date: paymentDate }),
    onSuccess: () => {
      toast.success("Payment recorded");
      void navigate({ to: "/bills/$id", params: { id } });
    },
    onError: (error) => setFormError(errorMessage(error)),
  });

  if (billQuery.isLoading) return <LoadingState label="Loading bill" />;
  if (billQuery.isError) return <ErrorState error={billQuery.error} onRetry={() => billQuery.refetch()} />;
  const bill = billQuery.data;
  if (!bill) return null;

  const numericAmount = Number(amount);
  const canSubmit = amount !== "" && numericAmount > 0 && numericAmount <= bill.amount_due && paymentDate;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Record payment — ${bill.bill_reference}`}
        actions={
          <Button variant="outline" onClick={() => navigate({ to: "/bills/$id", params: { id } })}>
            Back
          </Button>
        }
      />

      <ErrorBanner message={formError} />

      <FormSection title="Bill summary">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
            <p className="mt-1 text-lg font-semibold">{money(bill.total)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Amount due</p>
            <p className="mt-1 text-lg font-semibold text-primary">{money(bill.amount_due)}</p>
          </div>
        </div>
      </FormSection>

      <FormSection title="Payment details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount" htmlFor="amount" required>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              max={bill.amount_due}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <Field label="Payment via" htmlFor="payment_via" required>
            <Select value={paymentVia} onValueChange={(v) => setPaymentVia(v as PaymentVia)}>
              <SelectTrigger id="payment_via" className="h-9 w-full">
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
      </FormSection>

      <FormActions>
        <Button variant="outline" onClick={() => navigate({ to: "/bills/$id", params: { id } })}>
          Cancel
        </Button>
        <Button disabled={!canSubmit || payMutation.isPending} onClick={() => payMutation.mutate()}>
          {payMutation.isPending ? "Recording…" : "Record payment"}
        </Button>
      </FormActions>
    </div>
  );
}
