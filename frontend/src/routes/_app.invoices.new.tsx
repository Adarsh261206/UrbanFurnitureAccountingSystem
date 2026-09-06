import { useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import {
  FormSection,
  Field,
  FormGrid,
  FormActions,
  ErrorBanner,
} from "@/components/common/FormLayout";
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
import { OrderLineEditor, newLine, type DraftLine } from "@/components/sales/OrderLineEditor";
import { invoicesService, salesOrdersService, type InvoiceInput } from "@/services/salesService";
import {
  contactsService,
  productsService,
  accountsService,
  analyticalsService,
} from "@/services/masterDataService";
import { normalizeError, errorMessage } from "@/lib/api/errors";
import { today } from "@/lib/format";

export const Route = createFileRoute("/_app/invoices/new")({
  validateSearch: (search: Record<string, unknown>): { so?: string } =>
    typeof search.so === "string" ? { so: search.so } : {},
  head: () => ({
    meta: [
      { title: "New invoice — Urban Furniture Accounting" },
      { name: "description", content: "New invoice in the Urban Furniture Accounting System." },
      { property: "og:title", content: "New invoice — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "New invoice in the Urban Furniture Accounting System.",
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
  const navigate = useNavigate();
  const { so } = Route.useSearch();
  const [customerId, setCustomerId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [dueDate, setDueDate] = useState(today());
  const [salesOrderId, setSalesOrderId] = useState(so ?? "");
  const [lines, setLines] = useState<DraftLine[]>([newLine()]);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const contactsQuery = useQuery({
    queryKey: ["contacts", "all"],
    queryFn: () => contactsService.list({ limit: 200 }),
  });
  const productsQuery = useQuery({
    queryKey: ["products", "all"],
    queryFn: () => productsService.list({ limit: 200 }),
  });
  const accountsQuery = useQuery({
    queryKey: ["chart-of-accounts"],
    queryFn: () => accountsService.list(),
  });
  const analyticalsQuery = useQuery({
    queryKey: ["analyticals"],
    queryFn: () => analyticalsService.list(),
  });
  const salesOrdersQuery = useQuery({
    queryKey: ["sales-orders", "confirmed"],
    queryFn: () => salesOrdersService.list({ status: "confirmed", limit: 200 }),
  });

  /** Create Invoice from SO — carry forward customer + lines from the confirmed SO. */
  const soDetailQuery = useQuery({
    queryKey: ["sales-order", so],
    queryFn: () => (so ? salesOrdersService.get(so) : null),
    enabled: !!so,
  });

  const soLoadedRef = useRef(false);
  if (soDetailQuery.data && !soLoadedRef.current && !soDetailQuery.isLoading) {
    soLoadedRef.current = true;
    const soDetail = soDetailQuery.data;
    setCustomerId(soDetail.customer_id);
    setSalesOrderId(soDetail.id);
    setLines(
      soDetail.lines.length > 0
        ? soDetail.lines.map((l) => ({
            _key: crypto.randomUUID(),
            product_id: l.product_id,
            account_id: l.chart_of_account_id,
            analytical_id: l.budget_analytic_id ?? "",
            quantity: l.qty,
            unit_price: l.unit_price,
            tax_rate: l.tax_rate ?? 18,
          }))
        : [newLine()],
    );
  }

  const loading =
    contactsQuery.isLoading ||
    productsQuery.isLoading ||
    accountsQuery.isLoading ||
    analyticalsQuery.isLoading ||
    salesOrdersQuery.isLoading;
  const loadError =
    contactsQuery.error ||
    productsQuery.error ||
    accountsQuery.error ||
    analyticalsQuery.error ||
    salesOrdersQuery.error;

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
          ...(l.tax_rate !== undefined && Number(l.tax_rate) > 0
            ? { tax_rate: Number(l.tax_rate) }
            : {}),
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
      <PageHeader
        title="New invoice"
        description="Create a customer invoice, optionally linked to a confirmed sales order."
        backTo="/invoices"
        crumbs={[
          { label: "Sales" },
          { label: "Customer Invoices", to: "/invoices" },
          { label: "New invoice" },
        ]}
      />
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <FormSection title="Invoice details">
          <ErrorBanner message={formError} />
          <FormGrid>
            <Field label="Customer" htmlFor="customer_id" required error={fieldErrors.customer_id}>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger id="customer_id">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field
              label="Sales order"
              htmlFor="sales_order_id"
              hint="Optional — link this invoice to a confirmed sales order"
            >
              <Select
                value={salesOrderId || "__none"}
                onValueChange={(v) => setSalesOrderId(v === "__none" ? "" : v)}
              >
                <SelectTrigger id="sales_order_id">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">None</SelectItem>
                  {confirmedOrders.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.so_number} — {o.customer_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field
              label="Invoice date"
              htmlFor="invoice_date"
              required
              error={fieldErrors.invoice_date}
            >
              <Input
                id="invoice_date"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
              />
            </Field>
            <Field label="Due date" htmlFor="due_date" required error={fieldErrors.due_date}>
              <Input
                id="due_date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </Field>
          </FormGrid>
        </FormSection>

        <FormSection title="Lines" description="Add each product line for this invoice.">
          {fieldErrors.lines ? <ErrorBanner message={fieldErrors.lines} /> : null}
          <OrderLineEditor
            lines={lines}
            onChange={setLines}
            products={productsQuery.data?.products ?? []}
            accounts={accountsQuery.data ?? []}
            analyticals={analyticalsQuery.data ?? []}
          />
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
