import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { RequireAuth } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/States";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { creditNotesService, type CreditNoteInput } from "@/services/creditNoteService";
import { contactsService } from "@/services/masterDataService";
import { invoicesService } from "@/services/salesService";
import { useAuth } from "@/lib/auth/auth-context";
import { errorMessage } from "@/lib/api/errors";
import { money, date } from "@/lib/format";
import { validateNumber } from "@/lib/validation";

export const Route = createFileRoute("/_app/credit-notes/$id/")({
  head: () => ({
    meta: [
      { title: "Credit Note — Urban Furniture Accounting" },
      { name: "description", content: "Credit note details." },
      { property: "og:title", content: "Credit Note — Urban Furniture Accounting" },
      { property: "og:description", content: "Credit note details." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <CreditNotePage />
    </RequireAuth>
  ),
});

function CreditNotePage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canManage = user?.role === "admin" || user?.role === "accountant";

  const [cancelOpen, setCancelOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<CreditNoteInput>>({});
  const [subtotalInput, setSubtotalInput] = useState("0");
  const [taxRateInput, setTaxRateInput] = useState("0");
  const [errors, setErrors] = useState<{ subtotal?: string; taxRate?: string }>({});

  const query = useQuery({
    queryKey: ["credit-notes", id],
    queryFn: () => creditNotesService.get(id),
  });

  const contactsQuery = useQuery({
    queryKey: ["contacts", "all"],
    queryFn: () => contactsService.list({ limit: 200 }),
    enabled: canManage && editing,
  });

  const invoicesQuery = useQuery({
    queryKey: ["invoices", "all"],
    queryFn: () => invoicesService.list({ limit: 200 }),
    enabled: canManage && editing,
  });

  const isDraft = query.data?.status === "draft";

  const updateMutation = useMutation({
    mutationFn: (body: Partial<CreditNoteInput>) => creditNotesService.update(id, body),
    onSuccess: () => {
      toast.success("Credit note updated");
      setEditing(false);
      void queryClient.invalidateQueries({ queryKey: ["credit-notes", id] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const confirmMutation = useMutation({
    mutationFn: () => creditNotesService.confirm(id),
    onSuccess: () => {
      toast.success("Credit note confirmed");
      void queryClient.invalidateQueries({ queryKey: ["credit-notes", id] });
      void queryClient.invalidateQueries({ queryKey: ["credit-notes"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const cancelMutation = useMutation({
    mutationFn: () => creditNotesService.cancel(id),
    onSuccess: () => {
      toast.success("Credit note cancelled");
      setCancelOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["credit-notes", id] });
      void queryClient.invalidateQueries({ queryKey: ["credit-notes"] });
    },
    onError: (error) => {
      toast.error(errorMessage(error));
      setCancelOpen(false);
    },
  });

  function startEditing() {
    if (!query.data) return;
    setForm({
      contact_id: query.data.contact?.id ?? "",
      type: query.data.type,
      invoice_id: query.data.invoice_id,
      bill_id: query.data.bill_id,
      date: query.data.date,
      due_date: query.data.due_date,
      reason: query.data.reason ?? "",
      notes: query.data.notes ?? "",
    });
    setSubtotalInput(String(query.data.subtotal));
    setTaxRateInput(String(query.data.tax_rate));
    setEditing(true);
  }

  function handleSave() {
    const subtotalError = validateNumber(subtotalInput, "Subtotal", { min: 0 });
    const taxRateError = validateNumber(taxRateInput, "Tax rate", { min: 0, max: 100 });
    setErrors({
      subtotal: subtotalError ?? undefined,
      taxRate: taxRateError ?? undefined,
    });
    if (subtotalError || taxRateError) return;
    const payload: Partial<CreditNoteInput> = {
      ...form,
      subtotal: parseFloat(subtotalInput) || 0,
      tax_rate: parseFloat(taxRateInput) || 0,
    };
    updateMutation.mutate(payload);
  }

  if (query.isLoading) return <LoadingState label="Loading credit note" />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (!query.data) return <EmptyState title="Credit note not found" />;

  const cn = query.data;

  if (editing) {
    const taxAmount = (parseFloat(subtotalInput) || 0) * ((parseFloat(taxRateInput) || 0) / 100);
    const total = (parseFloat(subtotalInput) || 0) + taxAmount;

    return (
      <div className="space-y-6">
        <PageHeader
          title={`Edit ${cn.number}`}
          backTo="/credit-notes"
          crumbs={[{ label: "Sales" }, { label: "Credit Notes", to: "/credit-notes" }]}
          actions={
            <>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving…" : "Save"}
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </>
          }
        />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-lg border bg-card shadow-sm p-5 sm:p-6 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select
                    value={form.type ?? "credit_note"}
                    onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit_note">Credit Note</SelectItem>
                      <SelectItem value="debit_note">Debit Note</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={form.date ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Due date</Label>
                  <Input
                    type="date"
                    value={form.due_date ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value || null }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Reason</Label>
                <Input
                  value={form.reason ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value || null }))}
                  placeholder="e.g. Goods returned, overcharged"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))}
                  rows={3}
                />
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Amounts</h2>
            <div className="space-y-1.5">
              <Label>Subtotal</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={subtotalInput}
                onChange={(e) => {
                  setSubtotalInput(e.target.value);
                  setErrors((prev) => ({ ...prev, subtotal: undefined }));
                }}
                onBlur={() =>
                  setErrors((e) => ({
                    ...e,
                    subtotal: validateNumber(subtotalInput, "Subtotal", { min: 0 }) ?? undefined,
                  }))
                }
                aria-invalid={!!errors.subtotal}
                aria-describedby={errors.subtotal ? "subtotal-error" : undefined}
              />
              {errors.subtotal ? (
                <p id="subtotal-error" className="text-xs font-medium text-destructive">
                  {errors.subtotal}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Tax rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={taxRateInput}
                onChange={(e) => {
                  setTaxRateInput(e.target.value);
                  setErrors((prev) => ({ ...prev, taxRate: undefined }));
                }}
                onBlur={() =>
                  setErrors((e) => ({
                    ...e,
                    taxRate:
                      validateNumber(taxRateInput, "Tax rate", { min: 0, max: 100 }) ?? undefined,
                  }))
                }
                aria-invalid={!!errors.taxRate}
                aria-describedby={errors.taxRate ? "tax_rate-error" : undefined}
              />
              {errors.taxRate ? (
                <p id="tax_rate-error" className="text-xs font-medium text-destructive">
                  {errors.taxRate}
                </p>
              ) : null}
            </div>
            <dl className="space-y-2 text-sm border-t border-border pt-3">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tax amount</dt>
                <dd className="font-medium tabular-nums">{money(taxAmount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-foreground">Total</dt>
                <dd className="font-semibold tabular-nums">{money(total)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={cn.number}
        backTo="/credit-notes"
        crumbs={[{ label: "Sales" }, { label: "Credit Notes", to: "/credit-notes" }]}
        description={`${cn.type.replace(/_/g, " ")} — ${cn.contact?.name ?? "—"}`}
        actions={
          <>
            {canManage && isDraft ? (
              <Button variant="outline" onClick={startEditing}>
                Edit
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
            <Button variant="outline" onClick={() => navigate({ to: "/credit-notes" })}>
              Back
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border bg-card shadow-sm p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  {cn.type.replace(/_/g, " ")}
                </p>
                <h2 className="mt-1 text-base font-bold text-foreground">
                  {cn.contact?.name ?? "—"}
                </h2>
                {cn.contact?.gstin ? (
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    GSTIN: {cn.contact.gstin}
                  </p>
                ) : null}
              </div>
              <StatusBadge status={cn.status} />
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Date
                </dt>
                <dd className="mt-1 font-medium text-foreground">{date(cn.date)}</dd>
              </div>
              {cn.due_date ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                    Due date
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">{date(cn.due_date)}</dd>
                </div>
              ) : null}
              {cn.invoice_number ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                    Invoice
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">{cn.invoice_number}</dd>
                </div>
              ) : null}
              {cn.bill_reference ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                    Bill
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">{cn.bill_reference}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          {cn.reason ? (
            <div className="rounded-lg border bg-card shadow-sm p-5">
              <h2 className="text-sm font-semibold text-foreground">Reason</h2>
              <p className="mt-2 text-sm text-muted-foreground">{cn.reason}</p>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border bg-card shadow-sm p-5">
            <h2 className="text-sm font-semibold text-foreground">Summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium tabular-nums text-foreground">{money(cn.subtotal)}</dd>
              </div>
              {cn.tax_rate ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tax ({cn.tax_rate}%)</dt>
                  <dd className="font-medium tabular-nums text-foreground">
                    {money(cn.tax_amount)}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-border pt-2">
                <dt className="font-medium text-foreground">Total</dt>
                <dd className="font-semibold tabular-nums text-foreground">{money(cn.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Amount due</dt>
                <dd className="font-semibold tabular-nums text-foreground">
                  {money(cn.amount_due)}
                </dd>
              </div>
              {cn.notes ? (
                <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Notes: </span>
                  {cn.notes}
                </div>
              ) : null}
            </dl>
          </div>
        </div>
      </div>

      <ConfirmationModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this credit note?"
        description="This credit note is still in draft. Cancelling it cannot be undone."
        confirmLabel="Cancel credit note"
        destructive
        pending={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
      />
    </div>
  );
}
