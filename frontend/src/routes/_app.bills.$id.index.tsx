import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2, Circle } from "lucide-react";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, ErrorState } from "@/components/common/States";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { ErrorBanner } from "@/components/common/FormLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { billsService } from "@/services/purchaseService";
import { paymentsService } from "@/services/reportsService";
import { budgetsService } from "@/services/budgetsService";
import { errorMessage } from "@/lib/api/errors";
import { money, date } from "@/lib/format";
import { useBudgetWarnings } from "@/components/accounting/useBudgetWarnings";
import { BudgetWarningBanner } from "@/components/accounting/BudgetWarningBanner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/bills/$id/")({
  head: () => ({
    meta: [
      { title: "Bill — Urban Furniture Accounting" },
      { name: "description", content: "Bill in the Urban Furniture Accounting System." },
      { property: "og:title", content: "Bill — Urban Furniture Accounting" },
      { property: "og:description", content: "Bill in the Urban Furniture Accounting System." },
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
  const [cancelOpen, setCancelOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const billQuery = useQuery({
    queryKey: ["bill", id],
    queryFn: () => billsService.get(id),
  });

  const budgetsQuery = useQuery({
    queryKey: ["budgets", "warning-check"],
    queryFn: () => budgetsService.list({ limit: 200 }),
  });

  const warnings = useBudgetWarnings(billQuery.data?.lines ?? [], budgetsQuery.data?.budgets ?? []);

  const paymentsQuery = useQuery({
    queryKey: ["payments", "bill", id],
    queryFn: () => paymentsService.list({ vendor_bill_id: id, limit: 50 }),
    enabled: !!billQuery.data,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["bill", id] });
    void queryClient.invalidateQueries({ queryKey: ["bills"] });
  };

  const confirmMutation = useMutation({
    mutationFn: () => billsService.confirm(id),
    onSuccess: () => {
      toast.success("Bill confirmed");
      invalidate();
    },
    onError: (error) => setActionError(errorMessage(error)),
  });

  const cancelMutation = useMutation({
    mutationFn: () => billsService.cancel(id),
    onSuccess: () => {
      toast.success("Bill cancelled");
      setCancelOpen(false);
      invalidate();
    },
    onError: (error) => setActionError(errorMessage(error)),
  });

  const sendMutation = useMutation({
    mutationFn: () => billsService.send(id, { email_to: emailTo, subject, body }),
    onSuccess: () => {
      toast.success("Bill sent");
      setSendOpen(false);
    },
    onError: (error) => setActionError(errorMessage(error)),
  });

  const printMutation = useMutation({
    // A17 FLAG — print/send endpoints must exist on the backend.
    mutationFn: () => billsService.print(id),
    onSuccess: (blob, _v, _c) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bill-${bill?.bill_reference ?? id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (billQuery.isLoading) return <LoadingState label="Loading bill" />;
  if (billQuery.isError)
    return <ErrorState error={billQuery.error} onRetry={() => billQuery.refetch()} />;
  const bill = billQuery.data;
  if (!bill) return null;

  const isDraft = bill.status === "draft";
  const canPay = bill.status === "confirmed" && bill.amount_due > 0;
  const canPrintSend = bill.status !== "draft";

  const steps = [
    {
      label: "Purchase order",
      done: !!bill.purchase_order_id,
      link: bill.purchase_order_id
        ? ({ to: "/purchase-orders/$id", params: { id: bill.purchase_order_id } } as const)
        : null,
    },
    { label: "Bill", done: true },
    { label: "Confirmed", done: bill.status !== "draft" },
    { label: "Journal entry", done: !!bill.journal_entry_id },
    { label: "Payment", done: bill.amount_due < bill.total },
    { label: "Paid", done: bill.status === "paid" },
  ];

  return (
    <div className="space-y-6">
      {isDraft && warnings.length > 0 ? <BudgetWarningBanner warnings={warnings} /> : null}
      <PageHeader
        title={`Bill ${bill.bill_reference}`}
        crumbs={[{ label: "Purchase" }, { label: "Purchase Bill", to: "/bills" }]}
        description={`Vendor: ${bill.vendor.name}`}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate({ to: "/bills" })}>
              Back
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: "/bills/new" })}>
              New
            </Button>
            {isDraft ? (
              <Button disabled={confirmMutation.isPending} onClick={() => confirmMutation.mutate()}>
                {confirmMutation.isPending ? "Confirming…" : "Confirm"}
              </Button>
            ) : null}
            {isDraft ? (
              <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                Cancel
              </Button>
            ) : null}
            {canPay ? (
              <Button onClick={() => navigate({ to: "/bills/$id/pay", params: { id } })}>
                Pay
              </Button>
            ) : null}
            {canPrintSend ? (
              <Button
                variant="outline"
                disabled={printMutation.isPending}
                onClick={() => printMutation.mutate()}
              >
                {printMutation.isPending ? "Preparing…" : "Print"}
              </Button>
            ) : null}
            {canPrintSend ? (
              <Button variant="outline" onClick={() => setSendOpen(true)}>
                Send
              </Button>
            ) : null}
          </>
        }
      />

      <ErrorBanner message={actionError} />

      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card shadow-sm p-4 text-sm">
        {steps.map((step, index) => (
          <div key={step.label} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1.5",
                step.done ? "text-primary" : "text-muted-foreground",
              )}
            >
              {step.done ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
              {step.link ? (
                <Link
                  to={step.link.to}
                  params={step.link.params}
                  className="font-medium text-primary hover:underline"
                >
                  {step.label}
                </Link>
              ) : (
                <span className="font-medium">{step.label}</span>
              )}
            </div>
            {index < steps.length - 1 ? <span className="text-muted-foreground">→</span> : null}
          </div>
        ))}
      </div>

      <div className="grid gap-4 rounded-lg border bg-card shadow-sm p-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
          <div className="mt-1">
            <StatusBadge status={bill.status} />
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Bill date</p>
          <p className="mt-1 text-sm font-medium">{date(bill.bill_date)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Due date</p>
          <p className="mt-1 text-sm font-medium">{date(bill.due_date)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Payment via</p>
          <p className="mt-1 text-sm font-medium capitalize">{bill.payment_via ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="mt-1 text-lg font-semibold">{money(bill.total)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Amount due</p>
          <p className="mt-1 text-lg font-semibold text-primary">{money(bill.amount_due)}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Unit price</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {bill.lines.map((line) => (
              <tr key={line.id} className="border-t border-border">
                <td className="px-4 py-3">{line.sr_no}</td>
                <td className="px-4 py-3">{line.product_name ?? line.product_id}</td>
                <td className="px-4 py-3 text-right tabular-nums">{line.qty}</td>
                <td className="px-4 py-3 text-right tabular-nums">{money(line.unit_price)}</td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">
                  {money(line.total)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-muted/30">
              <td colSpan={4} className="px-4 py-3 text-right font-semibold">
                Total
              </td>
              <td className="px-4 py-3 text-right font-semibold">{money(bill.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Payments</h2>
        {paymentsQuery.isLoading ? (
          <LoadingState label="Loading payments" />
        ) : !paymentsQuery.data || paymentsQuery.data.payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Payment</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Via</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {paymentsQuery.data.payments.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{p.payment_number}</td>
                    <td className="px-4 py-3">{date(p.payment_date)}</td>
                    <td className="px-4 py-3 capitalize">{p.payment_via}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{money(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmationModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this bill?"
        description="This bill will be marked cancelled. This action cannot be undone."
        confirmLabel="Cancel bill"
        destructive
        pending={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
      />

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send bill by email</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email_to">Recipient email</Label>
              <Input
                id="email_to"
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body">Message</Label>
              <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!emailTo || !subject || sendMutation.isPending}
              onClick={() => sendMutation.mutate()}
            >
              {sendMutation.isPending ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
