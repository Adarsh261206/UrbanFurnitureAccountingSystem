import { useRef, useState } from "react";
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
import { billsService, purchaseOrdersService } from "@/services/purchaseService";
import {
  contactsService,
  productsService,
  accountsService,
  analyticalsService,
} from "@/services/masterDataService";
import { errorMessage } from "@/lib/api/errors";
import { today, money } from "@/lib/format";

export const Route = createFileRoute("/_app/bills/new")({
  validateSearch: (search: Record<string, unknown>): { po?: string } =>
    typeof search.po === "string" ? { po: search.po } : {},
  head: () => ({
    meta: [
      { title: "New bill — Urban Furniture Accounting" },
      { name: "description", content: "New bill in the Urban Furniture Accounting System." },
      { property: "og:title", content: "New bill — Urban Furniture Accounting" },
      { property: "og:description", content: "New bill in the Urban Furniture Accounting System." },
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
  const { po } = Route.useSearch();
  const [vendorId, setVendorId] = useState("");
  const [billDate, setBillDate] = useState(today());
  const [dueDate, setDueDate] = useState(today());
  const [purchaseOrderId, setPurchaseOrderId] = useState(po ?? "");
  const [lines, setLines] = useState<EditableLine[]>([emptyLine()]);
  const [formError, setFormError] = useState<string | null>(null);

  const contactsQuery = useQuery({
    queryKey: ["contacts", "for-bill"],
    queryFn: () => contactsService.list({ limit: 200 }),
  });
  const productsQuery = useQuery({
    queryKey: ["products", "for-bill"],
    queryFn: () => productsService.list({ limit: 200 }),
  });
  const accountsQuery = useQuery({ queryKey: ["accounts"], queryFn: () => accountsService.list() });
  const analyticalsQuery = useQuery({
    queryKey: ["analyticals"],
    queryFn: () => analyticalsService.list(),
  });
  const purchaseOrdersQuery = useQuery({
    queryKey: ["purchase-orders", "confirmed"],
    queryFn: () => purchaseOrdersService.list({ status: "confirmed", limit: 200 }),
  });

  /** Create Bill from PO — carry forward vendor + lines from the confirmed PO. */
  const poDetailQuery = useQuery({
    queryKey: ["purchase-order", po],
    queryFn: () => (po ? purchaseOrdersService.get(po) : null),
    enabled: !!po,
  });

  const poLoadedRef = useRef(false);
  if (poDetailQuery.data && !poLoadedRef.current && !poDetailQuery.isLoading) {
    poLoadedRef.current = true;
    const poDetail = poDetailQuery.data;
    setVendorId(poDetail.vendor_id);
    setPurchaseOrderId(poDetail.id);
    setLines(
      poDetail.lines.length > 0
        ? poDetail.lines.map((l) => ({
            product_id: l.product_id,
            account_id: l.chart_of_account_id,
            analytical_id: l.budget_analytic_id ?? "",
            quantity: String(l.qty),
            unit_price: String(l.unit_price),
          }))
        : [emptyLine()],
    );
  }

  const loading =
    contactsQuery.isLoading ||
    productsQuery.isLoading ||
    accountsQuery.isLoading ||
    analyticalsQuery.isLoading ||
    purchaseOrdersQuery.isLoading;
  const loadError =
    contactsQuery.error ||
    productsQuery.error ||
    accountsQuery.error ||
    analyticalsQuery.error ||
    purchaseOrdersQuery.error;

  const createMutation = useMutation({
    mutationFn: () =>
      billsService.create({
        vendor_id: vendorId,
        bill_date: billDate,
        due_date: dueDate,
        ...(purchaseOrderId ? { purchase_order_id: purchaseOrderId } : {}),
        lines: lines.map((l) => ({
          product_id: l.product_id,
          account_id: l.account_id,
          ...(l.analytical_id ? { analytical_id: l.analytical_id } : {}),
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price),
        })),
      }),
    onSuccess: (bill) => {
      toast.success("Bill created");
      void navigate({ to: "/bills/$id", params: { id: bill.id } });
    },
    onError: (error) => setFormError(errorMessage(error)),
  });

  const total = lines.reduce(
    (sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0),
    0,
  );

  const canSubmit =
    vendorId &&
    billDate &&
    dueDate &&
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
        title="New bill"
        actions={
          <Button variant="outline" onClick={() => navigate({ to: "/bills" })}>
            Back
          </Button>
        }
      />

      <ErrorBanner message={formError} />

      <FormSection title="Vendor & dates">
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
          <Field
            label="Purchase order"
            htmlFor="purchase_order_id"
            hint="Optional — link a confirmed PO"
          >
            <Select
              value={purchaseOrderId || "none"}
              onValueChange={(v) => setPurchaseOrderId(v === "none" ? "" : v)}
            >
              <SelectTrigger id="purchase_order_id" className="h-9 w-full">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {(purchaseOrdersQuery.data?.purchase_orders ?? []).map((po) => (
                  <SelectItem key={po.id} value={po.id}>
                    {po.po_number} — {po.vendor_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Bill date" htmlFor="bill_date" required>
            <Input
              id="bill_date"
              type="date"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
            />
          </Field>
          <Field label="Due date" htmlFor="due_date" required>
            <Input
              id="due_date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
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
        <Button variant="outline" onClick={() => navigate({ to: "/bills" })}>
          Cancel
        </Button>
        <Button
          disabled={!canSubmit || createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          {createMutation.isPending ? "Creating…" : "Create bill"}
        </Button>
      </FormActions>
    </div>
  );
}
