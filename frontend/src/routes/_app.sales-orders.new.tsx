import { useState } from "react";
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
import { salesOrdersService, type SalesOrderInput } from "@/services/salesService";
import {
  contactsService,
  productsService,
  accountsService,
  analyticalsService,
} from "@/services/masterDataService";
import { normalizeError, errorMessage } from "@/lib/api/errors";
import { today } from "@/lib/format";

export const Route = createFileRoute("/_app/sales-orders/new")({
  head: () => ({
    meta: [
      { title: "New sales order — Urban Furniture Accounting" },
      { name: "description", content: "New sales order in the Urban Furniture Accounting System." },
      { property: "og:title", content: "New sales order — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "New sales order in the Urban Furniture Accounting System.",
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
  const [customerId, setCustomerId] = useState("");
  const [orderDate, setOrderDate] = useState(today());
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

  const loading =
    contactsQuery.isLoading ||
    productsQuery.isLoading ||
    accountsQuery.isLoading ||
    analyticalsQuery.isLoading;
  const loadError =
    contactsQuery.error || productsQuery.error || accountsQuery.error || analyticalsQuery.error;

  const mutation = useMutation({
    mutationFn: () => {
      const body: SalesOrderInput = {
        customer_id: customerId,
        order_date: orderDate,
        lines: lines.map((l) => ({
          product_id: l.product_id,
          account_id: l.account_id,
          ...(l.analytical_id ? { analytical_id: l.analytical_id } : {}),
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price),
        })),
      };
      return salesOrdersService.create(body);
    },
    onSuccess: () => {
      toast.success("Sales order created");
      navigate({ to: "/sales-orders" });
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
    if (!orderDate) errors.order_date = "Order date is required";
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
        }}
      />
    );

  const contacts = contactsQuery.data?.contacts ?? [];
  const products = productsQuery.data?.products ?? [];
  const accounts = accountsQuery.data ?? [];
  const analyticals = analyticalsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="New sales order"
        description="Create a draft sales order for a customer."
        backTo="/sales-orders"
        crumbs={[
          { label: "Sales" },
          { label: "Sales Orders", to: "/sales-orders" },
          { label: "New sales order" },
        ]}
      />
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <FormSection title="Order details">
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
            <Field label="Order date" htmlFor="order_date" required error={fieldErrors.order_date}>
              <Input
                id="order_date"
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                required
              />
            </Field>
          </FormGrid>
        </FormSection>

        <FormSection title="Lines" description="Add each product line for this order.">
          {fieldErrors.lines ? <ErrorBanner message={fieldErrors.lines} /> : null}
          <OrderLineEditor
            lines={lines}
            onChange={setLines}
            products={productsQuery.data?.products ?? []}
            accounts={accountsQuery.data ?? []}
            analyticals={analyticalsQuery.data ?? []}
          />
          <FormActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/sales-orders" })}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create sales order"}
            </Button>
          </FormActions>
        </FormSection>
      </form>
    </div>
  );
}
