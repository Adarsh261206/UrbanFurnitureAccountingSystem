import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { FormSection, Field, FormGrid, FormActions, ErrorBanner } from "@/components/common/FormLayout";
import { LoadingState, ErrorState } from "@/components/common/States";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { invoicesService, salesOrdersService, type InvoiceInput } from "@/services/salesService";
import { contactsService, productsService, accountsService, analyticalsService } from "@/services/masterDataService";
import { normalizeError, errorMessage } from "@/lib/api/errors";
import { money, today } from "@/lib/format";
import type { OrderLineInput } from "@/types/api";

export const Route = createFileRoute("/_app/invoices/new")({
  head: () => ({
    meta: [
      { title: "New invoice — Urban Furniture Accounting" },
      { name: "description", content: "New invoice in the Urban Furniture Accounting System." },
      { property: "og:title", content: "New invoice — Urban Furniture Accounting" },
      { property: "og:description", content: "New invoice in the Urban Furniture Accounting System." },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin", "accountant"]}>
      <Page />
    </RequireRole>
  ),
});

type DraftLine = OrderLineInput & { _key: string };

function newLine(): DraftLine {
  return { _key: crypto.randomUUID(), product_id: "", account_id: "", analytical_id: "", quantity: 1, unit_price: 0 };
}

function Page() {
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [dueDate, setDueDate] = useState(today());
  const [salesOrderId, setSalesOrderId] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([newLine()]);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const contactsQuery = useQuery({ queryKey: ["contacts", "all"], queryFn: () => contactsService.list({ limit: 200 }) });
  const productsQuery = useQuery({ queryKey: ["products", "all"], queryFn: () => productsService.list({ limit: 200 }) });
  const accountsQuery = useQuery({ queryKey: ["chart-of-accounts"], queryFn: () => accountsService.list() });
  const analyticalsQuery = useQuery({ queryKey: ["analyticals"], queryFn: () => analyticalsService.list() });
  const salesOrdersQuery = useQuery({
    queryKey: ["sales-orders", "confirmed"],
    queryFn: () => salesOrdersService.list({ status: "confirmed", limit: 200 }),
  });

  const loading =
    contactsQuery.isLoading || productsQuery.isLoading || accountsQuery.isLoading || analyticalsQuery.isLoading || salesOrdersQuery.isLoading;
  const loadError = contactsQuery.error || productsQuery.error || accountsQuery.error || analyticalsQuery.error || salesOrdersQuery.error;

  const lineTotal = (l: DraftLine) => (Number(l.quantity) || 0) * (Number(l.unit_price) || 0);
  const invoiceTotal = useMemo(() => lines.reduce((sum, l) => sum + lineTotal(l), 0), [lines]);

  const mutation = useMutation({
    mutationFn: () => {
      const body: InvoiceInput = {
        customer_id: customerId,
        invoice_date: invoiceDate,
        due_date: dueDate,
        ...(salesOrderId ? { sales_order_id: salesOrderId } : {}),
        lines: lines.map((l) => ({
          product_id: l.product_id,
          account_id: l.account_id,
          ...(l.analytical_id ? { analytical_id: l.analytical_id } : {}),
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price),
        })),
      };
      return invoicesService.create(body);
    },
    onSuccess: (invoice) => {
      toast.success("Invoice created");
      navigate({ to: "/invoices/$id", params: { id: invoice.id } });
    },
    onError: (error) => {
      const normalized = normalizeError(error);
      if (normalized.field) setFieldErrors({ [normalized.field]: normalized.message });
      else setFormError(errorMessage(error));
    },
  });

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!customerId) errors.customer_id = "Customer is required";
    if (!invoiceDate) errors.invoice_date = "Invoice date is required";
    if (!dueDate) errors.due_date = "Due date is required";
    if (lines.length === 0) errors.lines = "Add at least one line";
    for (const l of lines) {
      if (!l.product_id || !l.account_id || !l.quantity || l.quantity <= 0 || l.unit_price < 0) {
        errors.lines = "Every line needs a product, account, quantity > 0 and a valid unit price";
        break;
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    mutation.mutate();
  }

  function updateLine(key: string, patch: Partial<DraftLine>) {
    setLines((ls) => ls.map((l) => (l._key === key ? { ...l, ...patch } : l)));
  }

  function onProductChange(key: string, productId: string) {
    const product = productsQuery.data?.products.find((p) => p.id === productId);
    updateLine(key, { product_id: productId, unit_price: product ? product.sales_price : 0 });
  }

  if (loading) return <LoadingState label="Loading form data" />;
  if (loadError)
    return (
      <ErrorState
        error={loadError}
        onRetry={() => {
          contactsQuery.refetch();
          productsQuery.refetch();
          accountsQuery.refetch();
          analyticalsQuery.refetch();
          salesOrdersQuery.refetch();
        }}
      />
    );

  const contacts = contactsQuery.data?.contacts ?? [];
  const products = productsQuery.data?.products ?? [];
  const accounts = accountsQuery.data ?? [];
  const analyticals = analyticalsQuery.data ?? [];
  const confirmedOrders = salesOrdersQuery.data?.sales_orders ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="New invoice" description="Create a customer invoice, optionally linked to a confirmed sales order." />
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <FormSection title="Invoice details">
          <ErrorBanner message={formError} />
          <FormGrid>
            <Field label="Customer" htmlFor="customer_id" required error={fieldErrors.customer_id}>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger id="customer_id"><SelectValue placeholder="Select a customer" /></SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Sales order" htmlFor="sales_order_id" hint="Optional — link this invoice to a confirmed sales order">
              <Select value={salesOrderId || "__none"} onValueChange={(v) => setSalesOrderId(v === "__none" ? "" : v)}>
                <SelectTrigger id="sales_order_id"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">None</SelectItem>
                  {confirmedOrders.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.so_number} — {o.customer_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Invoice date" htmlFor="invoice_date" required error={fieldErrors.invoice_date}>
              <Input id="invoice_date" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required />
            </Field>
            <Field label="Due date" htmlFor="due_date" required error={fieldErrors.due_date}>
              <Input id="due_date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </Field>
          </FormGrid>
        </FormSection>

        <FormSection title="Lines" description="Add each product line for this invoice.">
          {fieldErrors.lines ? <ErrorBanner message={fieldErrors.lines} /> : null}
          <div className="space-y-3">
            {lines.map((l) => (
              <div key={l._key} className="grid grid-cols-1 gap-3 rounded-md border border-border p-3 sm:grid-cols-12 sm:items-end">
                <div className="sm:col-span-3">
                  <Field label="Product" htmlFor={`product-${l._key}`}>
                    <Select value={l.product_id} onValueChange={(v) => onProductChange(l._key, v)}>
                      <SelectTrigger id={`product-${l._key}`}><SelectValue placeholder="Product" /></SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="sm:col-span-3">
                  <Field label="Account" htmlFor={`account-${l._key}`}>
                    <Select value={l.account_id} onValueChange={(v) => updateLine(l._key, { account_id: v })}>
                      <SelectTrigger id={`account-${l._key}`}><SelectValue placeholder="Account" /></SelectTrigger>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Analytical" htmlFor={`analytical-${l._key}`}>
                    <Select
                      value={l.analytical_id || "__none"}
                      onValueChange={(v) => updateLine(l._key, { analytical_id: v === "__none" ? "" : v })}
                    >
                      <SelectTrigger id={`analytical-${l._key}`}><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">None</SelectItem>
                        {analyticals.map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="sm:col-span-1">
                  <Field label="Qty" htmlFor={`qty-${l._key}`}>
                    <Input
                      id={`qty-${l._key}`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={l.quantity}
                      onChange={(e) => updateLine(l._key, { quantity: Number(e.target.value) })}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Unit price" htmlFor={`price-${l._key}`}>
                    <Input
                      id={`price-${l._key}`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={l.unit_price}
                      onChange={(e) => updateLine(l._key, { unit_price: Number(e.target.value) })}
                    />
                  </Field>
                </div>
                <div className="flex items-center justify-between gap-2 sm:col-span-1">
                  <span className="text-xs text-muted-foreground">{money(lineTotal(l))}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={lines.length === 1}
                    onClick={() => setLines((ls) => ls.filter((x) => x._key !== l._key))}
                    aria-label="Remove line"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Button type="button" variant="outline" size="sm" onClick={() => setLines((ls) => [...ls, newLine()])}>
              <Plus className="mr-1 size-4" /> Add line
            </Button>
            <p className="text-sm font-medium text-foreground">Estimated total: {money(invoiceTotal)}</p>
          </div>
          <FormActions>
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/invoices" })}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create invoice"}
            </Button>
          </FormActions>
        </FormSection>
      </form>
    </div>
  );
}
