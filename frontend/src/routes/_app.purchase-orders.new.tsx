import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState, ErrorState } from "@/components/common/States";
import {
  FormSection,
  Field,
  FormGrid,
  FormActions,
  ErrorBanner,
} from "@/components/common/FormLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LineEditor, emptyLine, type EditableLine } from "@/components/purchase/LineEditor";
import { purchaseOrdersService } from "@/services/purchaseService";
import {
  contactsService,
  productsService,
  accountsService,
  analyticalsService,
} from "@/services/masterDataService";
import { errorMessage } from "@/lib/api/errors";
import { today, money } from "@/lib/format";

export const Route = createFileRoute("/_app/purchase-orders/new")({
  head: () => ({
    meta: [
      { title: "New purchase order — Urban Furniture Accounting" },
      {
        name: "description",
        content: "New purchase order in the Urban Furniture Accounting System.",
      },
      { property: "og:title", content: "New purchase order — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "New purchase order in the Urban Furniture Accounting System.",
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
  const [vendorId, setVendorId] = useState("");
  const [orderDate, setOrderDate] = useState(today());
  const [lines, setLines] = useState<EditableLine[]>([emptyLine()]);
  const [formError, setFormError] = useState<string | null>(null);

  const contactsQuery = useQuery({
    queryKey: ["contacts", "for-po"],
    queryFn: () => contactsService.list({ limit: 200 }),
  });
  const productsQuery = useQuery({
    queryKey: ["products", "for-po"],
    queryFn: () => productsService.list({ limit: 200 }),
  });
  const accountsQuery = useQuery({ queryKey: ["accounts"], queryFn: () => accountsService.list() });
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

  const createMutation = useMutation({
    mutationFn: () =>
      purchaseOrdersService.create({
        vendor_id: vendorId,
        order_date: orderDate,
        lines: lines.map((l) => ({
          product_id: l.product_id,
          account_id: l.account_id,
          ...(l.analytical_id ? { analytical_id: l.analytical_id } : {}),
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price),
        })),
      }),
    onSuccess: () => {
      toast.success("Purchase order created");
      void navigate({ to: "/purchase-orders" });
    },
    onError: (error) => setFormError(errorMessage(error)),
  });

  const total = lines.reduce(
    (sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0),
    0,
  );

  const canSubmit =
    vendorId &&
    orderDate &&
    lines.length > 0 &&
    lines.every(
      (l) => l.product_id && l.account_id && Number(l.quantity) > 0 && Number(l.unit_price) >= 0,
    );

  if (loading) return <LoadingState label="Loading form data" />;
  if (loadError)
    return <ErrorState error={loadError} onRetry={() => void contactsQuery.refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="New purchase order"
        backTo="/purchase-orders"
        crumbs={[
          { label: "Purchase" },
          { label: "Purchase Orders", to: "/purchase-orders" },
          { label: "New purchase order" },
        ]}
      />

      <ErrorBanner message={formError} />

      <FormSection title="Vendor & date">
        <FormGrid>
          <Field label="Vendor" htmlFor="vendor_id" required>
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger id="vendor_id" className="h-9 w-full">
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {(contactsQuery.data?.contacts ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Order date" htmlFor="order_date" required>
            <Input
              id="order_date"
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
            />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection title="Lines">
        <LineEditor
          lines={lines}
          onChange={setLines}
          products={productsQuery.data?.products ?? []}
          accounts={accountsQuery.data ?? []}
          analyticals={analyticalsQuery.data ?? []}
        />
        <div className="mt-4 flex justify-end border-t border-border pt-4 text-sm font-semibold">
          Total: {money(total)}
        </div>
      </FormSection>

      <FormActions>
        <Button variant="outline" onClick={() => navigate({ to: "/purchase-orders" })}>
          Cancel
        </Button>
        <Button
          disabled={!canSubmit || createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          {createMutation.isPending ? "Creating…" : "Create purchase order"}
        </Button>
      </FormActions>
    </div>
  );
}
