import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import { imgUrl } from "@/lib/imgUrl";
import { toast } from "sonner";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState, LoadingState } from "@/components/common/States";
import {
  FormSection,
  Field,
  FormGrid,
  FormActions,
  ErrorBanner,
} from "@/components/common/FormLayout";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/common/ImageUpload";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  brandsService,
  categoriesService,
  productsService,
  type ProductInput,
} from "@/services/masterDataService";
import { normalizeError, errorMessage } from "@/lib/api/errors";
import type { Product, ProductType } from "@/types/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/products/$id")({
  head: () => ({
    meta: [
      { title: "Product — Urban Furniture Accounting" },
      { name: "description", content: "Product in the Urban Furniture Accounting System." },
      { property: "og:title", content: "Product — Urban Furniture Accounting" },
      { property: "og:description", content: "Product in the Urban Furniture Accounting System." },
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
  brand_id: string;
  sku: string;
  barcode: string;
  hsn_code: string;
  description: string;
  is_active: boolean;
  sales_price: string;
  cost: string;
  image_url: string;
}

function toForm(p: Product): FormState {
  return {
    name: p.name ?? "",
    product_type: p.product_type,
    category_id: p.category_id,
    brand_id: p.brand_id ?? "",
    sku: p.sku ?? "",
    barcode: p.barcode ?? "",
    hsn_code: p.hsn_code ?? "",
    description: p.description ?? "",
    is_active: p.is_active,
    sales_price: String(p.sales_price ?? ""),
    cost: String(p.cost ?? ""),
    image_url: p.image_url ?? "",
  };
}

function Page() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ["products", id], queryFn: () => productsService.get(id) });
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesService.list(),
  });
  const brandsQuery = useQuery({
    queryKey: ["brands"],
    queryFn: () => brandsService.list({ limit: 200 }),
  });

  const [form, setForm] = useState<FormState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");

  useEffect(() => {
    if (query.data) setForm(toForm(query.data));
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: (body: Partial<ProductInput>) => productsService.update(id, body),
    onSuccess: () => {
      toast.success("Product updated");
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      const normalized = normalizeError(error);
      if (normalized.field) setFieldErrors({ [normalized.field]: normalized.message });
      else setFormError(errorMessage(error));
    },
  });

  const addImage = useMutation({
    mutationFn: (url: string) => productsService.addImage(id, url),
    onSuccess: () => {
      toast.success("Image added");
      setNewImageUrl("");
      void queryClient.invalidateQueries({ queryKey: ["products", id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeImage = useMutation({
    mutationFn: (imageId: string) => productsService.removeImage(id, imageId),
    onSuccess: () => {
      toast.success("Image removed");
      void queryClient.invalidateQueries({ queryKey: ["products", id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setFieldErrors((e) => ({ ...e, [key]: "" }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form) return;
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
    if (form.barcode.trim() && !/^[\dA-Za-z-]{6,64}$/.test(form.barcode.trim()))
      errors["barcode"] = "Barcode must be 6-64 alphanumeric characters";
    if (form.hsn_code.trim() && !/^\d{2,8}$/.test(form.hsn_code.trim()))
      errors["hsn_code"] = "HSN must be 2-8 digits";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    mutation.mutate({
      name: form["name"].trim(),
      product_type: form["product_type"] as ProductType,
      category_id: form["category_id"],
      sales_price: Number(form["sales_price"]),
      cost: Number(form["cost"]),
      is_active: form.is_active,
      ...(form.brand_id ? { brand_id: form.brand_id } : {}),
      ...(form.sku.trim() ? { sku: form.sku.trim() } : {}),
      ...(form.barcode.trim() ? { barcode: form.barcode.trim() } : {}),
      ...(form.hsn_code.trim() ? { hsn_code: form.hsn_code.trim() } : {}),
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      ...(form["image_url"].trim() ? { image_url: form["image_url"].trim() } : {}),
    });
  }

  if (query.isLoading) return <LoadingState label="Loading product" />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (!query.data || !form) return null;

  const product = query.data;
  const images = product.images ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        backTo="/products"
        crumbs={[{ label: "Master Settings" }, { label: "Product", to: "/products" }]}
        description={`${product.brand_name ?? "No brand"} · ${product.sku ?? "No SKU"}`}
        actions={
          <Button variant="outline" onClick={() => navigate({ to: "/products" })}>
            Back to products
          </Button>
        }
      />
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
            <Field label="Brand" htmlFor="brand_id" error={fieldErrors["brand_id"] ?? null}>
              <Select value={form.brand_id} onValueChange={(v) => setField("brand_id", v)}>
                <SelectTrigger id="brand_id" aria-label="Brand">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {(brandsQuery.data?.brands ?? []).map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="SKU" htmlFor="sku" error={fieldErrors["sku"] ?? null}>
              <Input
                id="sku"
                value={form.sku}
                onChange={(e) => setField("sku", e.target.value)}
                placeholder="e.g. SOF-3S-001"
              />
            </Field>
            <Field label="Barcode" htmlFor="barcode" error={fieldErrors["barcode"] ?? null}>
              <Input
                id="barcode"
                value={form.barcode}
                onChange={(e) => setField("barcode", e.target.value)}
                placeholder="e.g. 8901234567890"
              />
            </Field>
            <Field label="HSN/SAC code" htmlFor="hsn_code" error={fieldErrors["hsn_code"] ?? null}>
              <Input
                id="hsn_code"
                value={form.hsn_code}
                onChange={(e) => setField("hsn_code", e.target.value)}
                placeholder="e.g. 9403"
              />
            </Field>
            <Field
              label="Primary image"
              htmlFor="image_url"
              error={fieldErrors["image_url"] ?? null}
            >
              <ImageUpload value={form.image_url} onChange={(url) => setField("image_url", url)} />
            </Field>
            <Field
              label="Active"
              htmlFor="is_active"
              hint="Inactive products stay hidden from new orders"
            >
              <label className="flex items-center gap-2 text-[13px]">
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.is_active}
                  onClick={() => setField("is_active", !form.is_active)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                    form.is_active ? "bg-primary" : "bg-input",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block size-4 transform rounded-full bg-white shadow transition-transform",
                      form.is_active ? "translate-x-6" : "translate-x-1",
                    )}
                  />
                </button>
                <span className="text-muted-foreground">
                  {form.is_active ? "Active" : "Inactive"}
                </span>
              </label>
            </Field>
          </FormGrid>
        </FormSection>

        <FormSection title="Description">
          <Field
            label="Description"
            htmlFor="description"
            error={fieldErrors["description"] ?? null}
          >
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={4}
              placeholder="Material, dimensions, finish, warranty details…"
            />
          </Field>
        </FormSection>

        <FormSection title="Pricing">
          <FormGrid>
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
        </FormSection>

        <FormSection title="Gallery">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.length > 0 ? (
              images.map((img) => (
                <div key={img.id} className="group relative overflow-hidden rounded-md border">
                  <img
                    src={imgUrl(img.image_url) ?? ""}
                    alt=""
                    loading="lazy"
                    className="h-32 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage.mutate(img.id)}
                    className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <p className="col-span-full py-4 text-center text-sm text-muted-foreground">
                No extra images yet.
              </p>
            )}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Input
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Or paste an image URL…"
              aria-label="New image URL"
              className="max-w-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!newImageUrl.trim() || addImage.isPending}
              onClick={() => addImage.mutate(newImageUrl.trim())}
            >
              <Plus className="size-3.5" /> Add URL
            </Button>
            <ImageUpload value="" onChange={(url) => addImage.mutate(url)} label="Upload" />
          </div>
        </FormSection>

        <FormActions>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
