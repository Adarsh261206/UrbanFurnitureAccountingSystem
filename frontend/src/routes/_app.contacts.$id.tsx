import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState, LoadingState } from "@/components/common/States";
import { FormSection, Field, FormGrid, FormActions, ErrorBanner } from "@/components/common/FormLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { contactsService, type ContactInput } from "@/services/masterDataService";
import { normalizeError, errorMessage } from "@/lib/api/errors";
import { date as fmtDate } from "@/lib/format";
import { toast } from "sonner";
import type { Contact } from "@/types/api";

export const Route = createFileRoute("/_app/contacts/$id")({
  head: () => ({
    meta: [
      { title: "Contact — Urban Furniture Accounting" },
      { name: "description", content: "Contact in the Urban Furniture Accounting System." },
      { property: "og:title", content: "Contact — Urban Furniture Accounting" },
      { property: "og:description", content: "Contact in the Urban Furniture Accounting System." },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin", "accountant"]}>
      <Page />
    </RequireRole>
  ),
});

function toInput(c: Contact): ContactInput {
  return {
    name: c.name ?? "",
    email: c.email ?? "",
    phone: c.phone ?? "",
    street: c.street ?? "",
    city: c.city ?? "",
    state: c.state ?? "",
    country: c.country ?? "",
    pincode: c.pincode ?? "",
    image_url: c.image_url ?? "",
  };
}

function Page() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["contacts", id],
    queryFn: () => contactsService.get(id),
  });

  const [form, setForm] = useState<ContactInput | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (query.data) setForm(toInput(query.data));
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: (body: Partial<ContactInput>) => contactsService.update(id, body),
    onSuccess: () => {
      toast.success("Contact updated");
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
    onError: (error) => {
      const normalized = normalizeError(error);
      if (normalized.field) setFieldErrors({ [normalized.field]: normalized.message });
      else setFormError(errorMessage(error));
    },
  });

  function setField<K extends keyof ContactInput>(key: K, value: ContactInput[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setFieldErrors((e) => ({ ...e, [key]: "" }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form) return;
    const errors: Record<string, string> = {};
    if (!form["name"].trim()) errors["name"] = "Name is required";
    if (!form["email"].trim()) errors["email"] = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form["email"].trim())) errors["email"] = "Enter a valid email";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    mutation.mutate(form);
  }

  if (query.isLoading) return <LoadingState label="Loading contact" />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (!query.data || !form) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={query.data.name}
        description={`Created ${fmtDate(query.data.created_at)}`}
        actions={
          <Button variant="outline" onClick={() => navigate({ to: "/contacts" })}>
            Back to contacts
          </Button>
        }
      />
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <FormSection title="Contact details">
          <ErrorBanner message={formError} />
          <FormGrid>
            <Field label="Name" htmlFor="name" required error={fieldErrors["name"] ?? null}>
              <Input id="name" value={form["name"]} onChange={(e) => setField("name", e.target.value)} required />
            </Field>
            <Field label="Email" htmlFor="email" required error={fieldErrors["email"] ?? null}>
              <Input id="email" type="email" value={form["email"]} onChange={(e) => setField("email", e.target.value)} required />
            </Field>
            <Field label="Phone" htmlFor="phone" error={fieldErrors["phone"] ?? null}>
              <Input id="phone" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
            </Field>
            <Field label="Image URL" htmlFor="image_url" error={fieldErrors["image_url"] ?? null}>
              <Input id="image_url" value={form.image_url} onChange={(e) => setField("image_url", e.target.value)} />
            </Field>
            <Field label="Street" htmlFor="street" error={fieldErrors["street"] ?? null}>
              <Input id="street" value={form.street} onChange={(e) => setField("street", e.target.value)} />
            </Field>
            <Field label="City" htmlFor="city" error={fieldErrors["city"] ?? null}>
              <Input id="city" value={form.city} onChange={(e) => setField("city", e.target.value)} />
            </Field>
            <Field label="State" htmlFor="state" error={fieldErrors["state"] ?? null}>
              <Input id="state" value={form.state} onChange={(e) => setField("state", e.target.value)} />
            </Field>
            <Field label="Country" htmlFor="country" error={fieldErrors["country"] ?? null}>
              <Input id="country" value={form.country} onChange={(e) => setField("country", e.target.value)} />
            </Field>
            <Field label="Pincode" htmlFor="pincode" error={fieldErrors["pincode"] ?? null}>
              <Input id="pincode" value={form.pincode} onChange={(e) => setField("pincode", e.target.value)} />
            </Field>
          </FormGrid>
          <FormActions>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </FormActions>
        </FormSection>
      </form>
    </div>
  );
}
