import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { DataTable, type Column } from "@/components/common/DataTable";
import { FormSection, Field, ErrorBanner } from "@/components/common/FormLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { categoriesService } from "@/services/masterDataService";
import { normalizeError, errorMessage } from "@/lib/api/errors";
import { toast } from "sonner";
import type { Category } from "@/types/api";

export const Route = createFileRoute("/_app/categories/")({
  head: () => ({
    meta: [
      { title: "Categories — Urban Furniture Accounting" },
      { name: "description", content: "Categories in the Urban Furniture Accounting System." },
      { property: "og:title", content: "Categories — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "Categories in the Urban Furniture Accounting System.",
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
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["categories"], queryFn: () => categoriesService.list() });

  const [name, setName] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => categoriesService.create({ name: name.trim() }),
    onSuccess: () => {
      toast.success("Category created");
      setName("");
      setFieldError(null);
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error) => {
      const normalized = normalizeError(error);
      if (normalized.field === "name") setFieldError(normalized.message);
      else setFormError(errorMessage(error));
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFieldError("Category name is required");
      return;
    }
    setFieldError(null);
    mutation.mutate();
  }

  const columns: Column<Category>[] = [
    {
      key: "name",
      header: "Name",
      cell: (r) => <span className="font-medium text-foreground">{r.name}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Categories" description="Product categories used across the catalog." />

      <FormSection title="Add category">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3" noValidate>
          <ErrorBanner message={formError} />
          <Field
            label="Category name"
            htmlFor="category-name"
            required
            error={fieldError}
            className="min-w-[240px] flex-1"
          >
            <Input
              id="category-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setFieldError(null);
              }}
              placeholder="e.g. Chairs"
            />
          </Field>
          <Button type="submit" disabled={mutation.isPending}>
            <Plus className="size-4" /> {mutation.isPending ? "Adding…" : "Add category"}
          </Button>
        </form>
      </FormSection>

      {query.isLoading ? (
        <LoadingState label="Loading categories" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data && query.data.length > 0 ? (
        <DataTable columns={columns} rows={query.data} rowKey={(r) => r.id} caption="Categories" />
      ) : (
        <EmptyState title="No categories yet" description="Add your first category above." />
      )}
    </div>
  );
}
