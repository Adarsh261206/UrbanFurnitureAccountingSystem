import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { brandsService } from "@/services/masterDataService";
import { normalizeError, errorMessage } from "@/lib/api/errors";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/brands/new")({
  head: () => ({
    meta: [
      { title: "New brand — Urban Furniture Accounting" },
      {
        name: "description",
        content: "New product brand in the Urban Furniture Accounting System.",
      },
      { property: "og:title", content: "New brand — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "New product brand in the Urban Furniture Accounting System.",
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
  const [name, setName] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => brandsService.create({ name: name.trim() }),
    onSuccess: () => {
      toast.success("Brand created");
      void navigate({ to: "/brands" });
    },
    onError: (error) => {
      const normalized = normalizeError(error);
      if (normalized.field) setFieldError(normalized.message);
      else setFormError(errorMessage(error));
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFieldError("Name is required");
      return;
    }
    mutation.mutate();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New brand"
        description="Add a manufacturer or product brand."
        backTo="/brands"
        crumbs={[
          { label: "Master Data" },
          { label: "Brands", to: "/brands" },
          { label: "New brand" },
        ]}
      />
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <FormSection title="Brand details">
          <ErrorBanner message={formError} />
          <FormGrid>
            <Field label="Brand name" htmlFor="name" required error={fieldError}>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setFieldError(null);
                }}
                placeholder="e.g. Godrej Interio"
                required
              />
            </Field>
          </FormGrid>
          <FormActions>
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/brands" })}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create brand"}
            </Button>
          </FormActions>
        </FormSection>
      </form>
    </div>
  );
}
