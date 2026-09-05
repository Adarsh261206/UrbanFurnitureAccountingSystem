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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { contactsService, type ContactInput } from "@/services/masterDataService";
import { normalizeError, errorMessage } from "@/lib/api/errors";
import { toast } from "sonner";
import type { ContactType } from "@/types/api";

export const Route = createFileRoute("/_app/contacts/new")({
  head: () => ({
    meta: [
      { title: "New contact — Urban Furniture Accounting" },
      { name: "description", content: "New contact in the Urban Furniture Accounting System." },
      { property: "og:title", content: "New contact — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "New contact in the Urban Furniture Accounting System.",
      },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin", "accountant"]}>
      <Page />
    </RequireRole>
  ),
});

const CONTACT_TYPES: ContactType[] = ["customer", "vendor", "both"];

const EMPTY: ContactInput = {
  name: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
  image_url: "",
  contact_type: "both",
  gstin: "",
  pan: "",
};

function Page() {
  const navigate = useNavigate();
  const [form, setForm] = useState<ContactInput>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      const body: ContactInput = {
        name: form["name"].trim(),
        email: form["email"].trim(),
        contact_type: form.contact_type ?? "both",
        ...(form.phone ? { phone: form.phone.trim() } : {}),
        ...(form.street ? { street: form.street.trim() } : {}),
        ...(form.city ? { city: form.city.trim() } : {}),
        ...(form.state ? { state: form.state.trim() } : {}),
        ...(form.country ? { country: form.country.trim() } : {}),
        ...(form.pincode ? { pincode: form.pincode.trim() } : {}),
        ...(form.image_url ? { image_url: form.image_url.trim() } : {}),
        ...(form.gstin ? { gstin: form.gstin.trim() } : {}),
        ...(form.pan ? { pan: form.pan.trim() } : {}),
      };
      return contactsService.create(body);
    },
    onSuccess: (contact) => {
      toast.success("Contact created");
      if (contact?.id) {
        void navigate({ to: "/contacts/$id", params: { id: contact.id } });
      } else {
        void navigate({ to: "/contacts" });
      }
    },
    onError: (error) => {
      const normalized = normalizeError(error);
      if (normalized.field) {
        setFieldErrors({ [normalized.field]: normalized.message });
      } else {
        setFormError(errorMessage(error));
      }
    },
  });

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form["name"].trim()) errors["name"] = "Name is required";
    if (!form["email"].trim()) errors["email"] = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form["email"].trim()))
      errors["email"] = "Enter a valid email";
    if (form.gstin && form.gstin.trim() && !/^[0-9A-Z]{15}$/.test(form.gstin.trim().toUpperCase()))
      errors["gstin"] = "GSTIN must be 15 characters";
    if (
      form.pan &&
      form.pan.trim() &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.pan.trim().toUpperCase())
    )
      errors["pan"] = "PAN must be 10 characters (e.g. ABCDE1234F)";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    mutation.mutate();
  }

  function setField<K extends keyof ContactInput>(key: K, value: ContactInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((e) => ({ ...e, [key]: "" }));
  }

  return (
    <div className="space-y-6">
      <PageHeader title="New contact" description="Add a customer or vendor contact." />
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <FormSection title="Contact details">
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
            <Field label="Email" htmlFor="email" required error={fieldErrors["email"] ?? null}>
              <Input
                id="email"
                type="email"
                value={form["email"]}
                onChange={(e) => setField("email", e.target.value)}
                required
              />
            </Field>
            <Field label="Phone" htmlFor="phone" error={fieldErrors["phone"] ?? null}>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </Field>
            <Field label="Image URL" htmlFor="image_url" error={fieldErrors["image_url"] ?? null}>
              <Input
                id="image_url"
                value={form.image_url}
                onChange={(e) => setField("image_url", e.target.value)}
              />
            </Field>
            <Field
              label="Contact type"
              htmlFor="contact_type"
              error={fieldErrors["contact_type"] ?? null}
            >
              <Select
                value={form.contact_type}
                onValueChange={(v) => setField("contact_type", v as ContactType)}
              >
                <SelectTrigger id="contact_type" aria-label="Contact type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="GSTIN" htmlFor="gstin" error={fieldErrors["gstin"] ?? null}>
              <Input
                id="gstin"
                value={form.gstin}
                onChange={(e) => setField("gstin", e.target.value)}
                placeholder="e.g. 07AABCU9603R1ZM"
              />
            </Field>
            <Field label="PAN" htmlFor="pan" error={fieldErrors["pan"] ?? null}>
              <Input
                id="pan"
                value={form.pan}
                onChange={(e) => setField("pan", e.target.value)}
                placeholder="e.g. AABCU9603R"
              />
            </Field>
            <Field label="Street" htmlFor="street" error={fieldErrors["street"] ?? null}>
              <Input
                id="street"
                value={form.street}
                onChange={(e) => setField("street", e.target.value)}
              />
            </Field>
            <Field label="City" htmlFor="city" error={fieldErrors["city"] ?? null}>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
              />
            </Field>
            <Field label="State" htmlFor="state" error={fieldErrors["state"] ?? null}>
              <Input
                id="state"
                value={form.state}
                onChange={(e) => setField("state", e.target.value)}
              />
            </Field>
            <Field label="Country" htmlFor="country" error={fieldErrors["country"] ?? null}>
              <Input
                id="country"
                value={form.country}
                onChange={(e) => setField("country", e.target.value)}
              />
            </Field>
            <Field label="Pincode" htmlFor="pincode" error={fieldErrors["pincode"] ?? null}>
              <Input
                id="pincode"
                value={form.pincode}
                onChange={(e) => setField("pincode", e.target.value)}
              />
            </Field>
          </FormGrid>
          <FormActions>
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/contacts" })}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create contact"}
            </Button>
          </FormActions>
        </FormSection>
      </form>
    </div>
  );
}
