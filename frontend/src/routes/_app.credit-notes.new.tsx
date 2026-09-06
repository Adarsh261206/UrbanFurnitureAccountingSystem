import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
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
import { errorMessage } from "@/lib/api/errors";
import { money } from "@/lib/format";
import { validateNumber, validateDateOrder } from "@/lib/validation";

export const Route = createFileRoute("/_app/credit-notes/new")({
  head: () => ({
    meta: [
      { title: "New Credit Note — Urban Furniture Accounting" },
      { name: "description", content: "Create a new credit note." },
      { property: "og:title", content: "New Credit Note — Urban Furniture Accounting" },
      { property: "og:description", content: "Create a new credit note." },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin", "accountant"]}>
      <NewCreditNotePage />
    </RequireRole>
  ),
});

function NewCreditNotePage() {
  const navigate = useNavigate();
  const [contactId, setContactId] = useState("");
  const [type, setType] = useState("credit_note");
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [subtotal, setSubtotal] = useState("0");
  const [taxRate, setTaxRate] = useState("0");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    contact?: string;
    date?: string;
    dueDate?: string;
    subtotal?: string;
    taxRate?: string;
  }>({});

  const contactsQuery = useQuery({
    queryKey: ["contacts", "all"],
    queryFn: () => contactsService.list({ limit: 200 }),
  });

  const invoicesQuery = useQuery({
    queryKey: ["invoices", "all"],
    queryFn: () => invoicesService.list({ limit: 200 }),
  });

  const mutation = useMutation({
    mutationFn: () => {
      const body: CreditNoteInput = {
        contact_id: contactId,
        type,
        invoice_id: invoiceId,
        date,
        due_date: dueDate || null,
        subtotal: parseFloat(subtotal) || 0,
        tax_rate: parseFloat(taxRate) || 0,
        reason: reason || null,
        notes: notes || null,
      };
      return creditNotesService.create(body);
    },
    onSuccess: (cn) => {
      toast.success("Credit note created");
      navigate({ to: "/credit-notes/$id", params: { id: cn.id } });
    },
    onError: (error) => setFormError(errorMessage(error)),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const next = validateFields();
    const first = Object.values(next).find(Boolean);
    if (first) {
      setFormError(first);
      return;
    }
    if (!contactId) {
      setFormError("Contact is required");
      return;
    }
    mutation.mutate();
  }

  function validateFields() {
    const next = {
      contact: contactId ? undefined : "Contact is required.",
      date: date && isNaN(new Date(date).getTime()) ? "Enter a valid date." : undefined,
      dueDate:
        dueDate && isNaN(new Date(dueDate).getTime())
          ? "Enter a valid date."
          : dueDate && date
            ? (validateDateOrder(date, dueDate, "date", "Due date") ?? undefined)
            : undefined,
      subtotal: validateNumber(subtotal, "Subtotal", { min: 0 }) ?? undefined,
      taxRate: validateNumber(taxRate, "Tax rate", { min: 0, max: 100 }) ?? undefined,
    };
    setErrors(next);
    return next;
  }

  const taxAmount = (parseFloat(subtotal) || 0) * ((parseFloat(taxRate) || 0) / 100);
  const total = (parseFloat(subtotal) || 0) + taxAmount;

  return (
    <div className="space-y-6">
      <PageHeader
        title="New credit note"
        description="Create a credit or debit note against a customer or vendor."
        backTo="/credit-notes"
        crumbs={[
          { label: "Sales" },
          { label: "Credit Notes", to: "/credit-notes" },
          { label: "New" },
        ]}
      />

      {formError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {formError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border bg-card shadow-sm p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Contact *</Label>
              <Select
                value={contactId}
                onValueChange={(v) => {
                  setContactId(v);
                  setErrors((e) => ({ ...e, contact: undefined }));
                }}
              >
                <SelectTrigger
                  onBlur={() =>
                    setErrors((e) => ({
                      ...e,
                      contact: contactId ? undefined : "Contact is required.",
                    }))
                  }
                  aria-invalid={!!errors.contact}
                  aria-describedby={errors.contact ? "contact-error" : undefined}
                >
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  {(contactsQuery.data?.contacts ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.contact ? (
                <p id="contact-error" className="text-xs font-medium text-destructive">
                  {errors.contact}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select value={type} onValueChange={setType}>
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
              <Label>Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setErrors((prev) => ({ ...prev, date: undefined, dueDate: undefined }));
                }}
                onBlur={() =>
                  setErrors((e) => ({
                    ...e,
                    date:
                      date && isNaN(new Date(date).getTime()) ? "Enter a valid date." : undefined,
                  }))
                }
                aria-invalid={!!errors.date}
                aria-describedby={errors.date ? "date-error" : undefined}
              />
              {errors.date ? (
                <p id="date-error" className="text-xs font-medium text-destructive">
                  {errors.date}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  setErrors((prev) => ({ ...prev, dueDate: undefined }));
                }}
                onBlur={() =>
                  setErrors((e) => ({
                    ...e,
                    dueDate:
                      dueDate && isNaN(new Date(dueDate).getTime())
                        ? "Enter a valid date."
                        : dueDate && date
                          ? (validateDateOrder(date, dueDate, "date", "Due date") ?? undefined)
                          : undefined,
                  }))
                }
                aria-invalid={!!errors.dueDate}
                aria-describedby={errors.dueDate ? "due_date-error" : undefined}
              />
              {errors.dueDate ? (
                <p id="due_date-error" className="text-xs font-medium text-destructive">
                  {errors.dueDate}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Linked Invoice</Label>
              <Select
                value={invoiceId ?? "__none"}
                onValueChange={(v) => setInvoiceId(v === "__none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">None</SelectItem>
                  {(invoicesQuery.data?.invoices ?? []).map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.invoice_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Goods returned, overcharged"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2" />
          <div className="rounded-lg border bg-card shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Amounts</h2>
            <div className="space-y-1.5">
              <Label>Subtotal</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={subtotal}
                onChange={(e) => {
                  setSubtotal(e.target.value);
                  setErrors((prev) => ({ ...prev, subtotal: undefined }));
                }}
                onBlur={() =>
                  setErrors((e) => ({
                    ...e,
                    subtotal: validateNumber(subtotal, "Subtotal", { min: 0 }) ?? undefined,
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
                value={taxRate}
                onChange={(e) => {
                  setTaxRate(e.target.value);
                  setErrors((prev) => ({ ...prev, taxRate: undefined }));
                }}
                onBlur={() =>
                  setErrors((e) => ({
                    ...e,
                    taxRate: validateNumber(taxRate, "Tax rate", { min: 0, max: 100 }) ?? undefined,
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

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/credit-notes" })}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Create credit note"}
          </Button>
        </div>
      </form>
    </div>
  );
}
