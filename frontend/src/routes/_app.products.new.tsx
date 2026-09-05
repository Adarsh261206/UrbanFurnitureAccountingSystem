import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import {
  FormSection,
  Field,
  FormGrid,
  FormActions,
  ErrorBanner,
} from "@/components/common/FormLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  categoriesService,
  productsService,
  type ProductInput,
} from "@/services/masterDataService";
import { normalizeError, errorMessage } from "@/lib/api/errors";
import { toast } from "sonner";
import type { ProductType } from "@/types/api";

export const Route = createFileRoute("/_app/products/new")({
  head: () => ({
    meta: [
      { title: "New product — Urban Furniture Accounting" },
      { name: "description", content: "New product in the Urban Furniture Accounting System." },
      { property: "og:title", content: "New product — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "New product in the Urban Furniture Accounting System.",
      },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin", "accountant"]}>
      <Page />
    </RequireRole>
  ),
});

const PRODUCT_TYPES: ProductType[] = ["goods", "service", "combo"];

interface FormState {
  name: string;
  product_type: ProductType | "";
  category_id: string;
  sales_price: string;
  cost: string;
  image_url: string;
}

const EMPTY: FormState = {
  name: "",
  product_type: "",
  category_id: "",
  sales_price: "",
  cost: "",
  image_url: "",
};

function Page() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesService.list(),
  });

  const mutation = useMutation({
    mutationFn: () => {
      const body: ProductInput = {
        name: form["name"].trim(),
        product_type: form["product_type"] as ProductType,
        category_id: form["category_id"],
        sales_price: Number(form["sales_price"]),
        cost: Number(form["cost"]),
        ...(form.image_url ? { image_url: form.image_url.trim() } : {}),
      };
      return productsService.create(body);
    },
    onSuccess: (product) => {
      toast.success("Product created");
      if (product?.id) {
        void navigate({ to: "/products/$id", params: { id: product.id } });
      } else {
        void navigate({ to: "/products" });
      }
    },
    onError: (error) => {
      const normalized = normalizeError(error);
      if (normalized.field) setFieldErrors({ [normalized.field]: normalized.message });
      else setFormError(errorMessage(error));
    },
  });

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form["name"].trim()) errors["name"] = "Name is required";
    if (!form["product_type"]) errors["product_type"] = "Product type is required";
    if (!form["category_id"]) errors["category_id"] = "Category is required";
    if (
      !form["sales_price"].trim() ||
      Number.isNaN(Number(form["sales_price"])) ||
      Number(form["sales_price"]) < 0
    )
      errors["sales_price"] = "Enter a valid sales price";
    if (!form["cost"].trim() || Number.isNaN(Number(form["cost"])) || Number(form["cost"]) < 0)
      errors["cost"] = "Enter a valid cost";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    mutation.mutate();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="New product" description="Add a good, service or combo item." />
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <FormSection title="Product details">
          <ErrorBanner message={formError} />
          <FormGrid>
            <Field label="Name" htmlFor="name" required error={fieldErrors["name"] ?? null}>
              <Input
                id="name"
                value={form["name"]}
                onChange={(e) => setField("name", e.target.value)}
                required
              />
            </Field>
            <Field
              label="Product type"
              htmlFor="product_type"
              required
              error={fieldErrors["product_type"] ?? null}
            >
              <Select
                value={form["product_type"]}
                onValueChange={(v) => setField("product_type", v as ProductType)}
              >
                <SelectTrigger id="product_type" aria-label="Product type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field
              label="Category"
              htmlFor="category_id"
              required
              error={fieldErrors["category_id"] ?? null}
            >
              <Select value={form["category_id"]} onValueChange={(v) => setField("category_id", v)}>
                <SelectTrigger id="category_id" aria-label="Category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {(categoriesQuery.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Image URL" htmlFor="image_url" error={fieldErrors["image_url"] ?? null}>
              <Input
                id="image_url"
                value={form.image_url}
                onChange={(e) => setField("image_url", e.target.value)}
              />
            </Field>
            <Field
              label="Sales price"
              htmlFor="sales_price"
              required
              error={fieldErrors["sales_price"] ?? null}
            >
              <Input
                id="sales_price"
                type="number"
                step="0.01"
                min="0"
                value={form["sales_price"]}
                onChange={(e) => setField("sales_price", e.target.value)}
                required
              />
            </Field>
            <Field label="Cost" htmlFor="cost" required error={fieldErrors["cost"] ?? null}>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                value={form["cost"]}
                onChange={(e) => setField("cost", e.target.value)}
                required
              />
            </Field>
          </FormGrid>
          <FormActions>
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/products" })}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create product"}
            </Button>
          </FormActions>
        </FormSection>
      </form>
    </div>
  );
}
