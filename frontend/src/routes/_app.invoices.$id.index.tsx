import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2, Circle, FileText, Send as SendIcon } from "lucide-react";
import { RequireAuth } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/States";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { invoicesService } from "@/services/salesService";
import { paymentsService } from "@/services/reportsService";
import { useAuth } from "@/lib/auth/auth-context";
import { errorMessage } from "@/lib/api/errors";
import { money, date } from "@/lib/format";

export const Route = createFileRoute("/_app/invoices/$id/")({
  head: () => ({
    meta: [
      { title: "Invoice — Urban Furniture Accounting" },
      { name: "description", content: "Invoice in the Urban Furniture Accounting System." },
      { property: "og:title", content: "Invoice — Urban Furniture Accounting" },
      { property: "og:description", content: "Invoice in the Urban Furniture Accounting System." },
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canManage = user?.role === "admin" || user?.role === "accountant";

  const [cancelOpen, setCancelOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendForm, setSendForm] = useState({ email_to: "", subject: "", body: "" });
  const [printing, setPrinting] = useState(false);

  const query = useQuery({
    queryKey: ["invoices", id],
    queryFn: () => invoicesService.get(id),
  });

  const paymentsQuery = useQuery({
    queryKey: ["payments", "invoice", id],
    queryFn: () => paymentsService.list({ invoice_id: id }),
    enabled: !!id,
  });

  const confirmMutation = useMutation({
    mutationFn: () => invoicesService.confirm(id),
    onSuccess: () => {
      toast.success("Invoice confirmed");
      void queryClient.invalidateQueries({ queryKey: ["invoices", id] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const cancelMutation = useMutation({
    mutationFn: () => invoicesService.cancel(id),
    onSuccess: () => {
      toast.success("Invoice cancelled");
      setCancelOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["invoices", id] });
    },
    onError: (error) => {
      toast.error(errorMessage(error));
      setCancelOpen(false);
    },
  });

  const sendMutation = useMutation({
    mutationFn: () => invoicesService.send(id, sendForm),
    onSuccess: () => {
      toast.success("Invoice sent");
      setSendOpen(false);
      setSendForm({ email_to: "", subject: "", body: "" });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  async function handlePrint() {
    if (!query.data) return;
    setPrinting(true);
    try {
      const blob = await invoicesService.print(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${query.data.invoice_reference}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPrinting(false);
    }
  }

  if (query.isLoading) return <LoadingState label="Loading invoice" />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (!query.data) return <EmptyState title="Invoice not found" />;

  const invoice = query.data;
  const isDraft = invoice.status === "draft";
  const isConfirmed = invoice.status === "confirmed";
  const canPay = isConfirmed && invoice.amount_due > 0;
  const canPrintSend = invoice.status !== "draft";
  const payments = paymentsQuery.data?.payments ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Invoice ${invoice.invoice_number}`}
        description={invoice.invoice_reference}
        actions={
          <>
            {canManage ? (
              <Button variant="outline" onClick={() => navigate({ to: "/invoices/new" })}>
                New
              </Button>
            ) : null}
            {canManage && isDraft ? (
              <Button disabled={confirmMutation.isPending} onClick={() => confirmMutation.mutate()}>
                {confirmMutation.isPending ? "Confirming…" : "Confirm"}
              </Button>
            ) : null}
            {canManage && isDraft ? (
              <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                Cancel
              </Button>
            ) : null}
            {canPay ? (
              <Button onClick={() => navigate({ to: "/invoices/$id/pay", params: { id } })}>Pay</Button>
            ) : null}
            {canPrintSend ? (
              <Button variant="outline" disabled={printing} onClick={handlePrint}>
                <FileText className="mr-1 size-4" /> {printing ? "Preparing…" : "Print"}
              </Button>
            ) : null}
            {canPrintSend ? (
              <Button variant="outline" onClick={() => setSendOpen(true)}>
                <SendIcon className="mr-1 size-4" /> Send
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => navigate({ to: "/invoices" })}>
              Back
            </Button>
          </>
        }
      />

      <WorkflowStrip
        status={invoice.status}
        amountDue={invoice.amount_due}
        journalEntryId={invoice.journal_entry_id}
        salesOrderId={invoice.sales_order_id}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Invoice document</h2>
                <p className="mt-1 text-sm text-muted-foreground">{invoice.customer?.name}</p>
              </div>
              <StatusBadge status={invoice.status} />
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Invoice date</dt>
                <dd className="mt-1 font-medium text-foreground">{date(invoice.invoice_date)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Due date</dt>
                <dd className="mt-1 font-medium text-foreground">{date(invoice.due_date)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Payment type</dt>
                <dd className="mt-1 font-medium capitalize text-foreground">{invoice.payment_type ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Paid via</dt>
                <dd className="mt-1 font-medium capitalize text-foreground">{invoice.payment_via ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Partner</dt>
                <dd className="mt-1 font-medium text-foreground">{invoice.partner?.name ?? "—"}</dd>
              </div>
              {invoice.journal_entry_id ? (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Journal entry</dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {canManage ? (
                      <Link
                        to="/journal-entries"
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        {invoice.journal_entry_id}
                      </Link>
                    ) : (
                      invoice.journal_entry_id
                    )}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unit price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((line) => (
                  <tr key={line.id} className="border-t border-border">
                    <td className="px-4 py-3">{line.sr_no}</td>
                    <td className="px-4 py-3">{line.product_name ?? line.product_id}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{line.qty}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{money(line.unit_price)}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">{money(line.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Payments recorded</h2>
            {paymentsQuery.isLoading ? (
              <LoadingState label="Loading payments" />
            ) : payments.length === 0 ? (
              <EmptyState title="No payments recorded yet" />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment #</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Via</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-t border-border">
                        <td className="px-4 py-3">{p.payment_number}</td>
                        <td className="px-4 py-3">{date(p.payment_date)}</td>
                        <td className="px-4 py-3 capitalize">{p.payment_via}</td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">{money(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total</dt>
                <dd className="font-medium tabular-nums text-foreground">{money(invoice.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Amount due</dt>
                <dd className="font-semibold tabular-nums text-foreground">{money(invoice.amount_due)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <ConfirmationModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this invoice?"
        description="This invoice is still in draft. Cancelling it cannot be undone."
        confirmLabel="Cancel invoice"
        destructive
        pending={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
      />

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send invoice by email</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email_to">Recipient email</Label>
              <Input
                id="email_to"
                type="email"
                value={sendForm.email_to}
                onChange={(e) => setSendForm((f) => ({ ...f, email_to: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={sendForm.subject}
                onChange={(e) => setSendForm((f) => ({ ...f, subject: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                rows={5}
                value={sendForm.body}
                onChange={(e) => setSendForm((f) => ({ ...f, body: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={sendMutation.isPending || !sendForm.email_to}
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

function WorkflowStrip({
  status,
  amountDue,
  journalEntryId,
  salesOrderId,
}: {
  status: string;
  amountDue: number;
  journalEntryId: string | null;
  salesOrderId: string | null;
}) {
  const steps = [
    { label: "Sales order", done: !!salesOrderId, alwaysShown: true },
    { label: "Invoice confirmed", done: status === "confirmed" || status === "paid" },
    { label: "Journal entry", done: !!journalEntryId },
    { label: "Paid", done: status === "paid" || (status !== "draft" && amountDue <= 0) },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
      {steps.map((step, idx) => (
        <div key={step.label} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            {step.done ? (
              <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
            ) : (
              <Circle className="size-4 text-muted-foreground" aria-hidden />
            )}
            <span className={step.done ? "text-sm font-medium text-foreground" : "text-sm text-muted-foreground"}>
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 ? <span className="text-muted-foreground">→</span> : null}
        </div>
      ))}
    </div>
  );
}
