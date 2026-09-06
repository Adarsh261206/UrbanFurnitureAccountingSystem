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
import { ImageUpload } from "@/components/common/ImageUpload";
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
import { enumLabel } from "@/lib/labels";
import {
  validateRequired,
  validateEmail,
  validateMobile,
  validateGstin,
  validatePan,
  validatePincode,
} from "@/lib/validation";

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
    const name = validateRequired(form["name"], "Name");
    if (name) errors["name"] = name;
    if (!form["email"].trim()) errors["email"] = "Email is required.";
    else {
      const email = validateEmail(form["email"]);
      if (email) errors["email"] = email;
    }
    const phone = validateMobile(form.phone ?? "");
    if (phone) errors["phone"] = phone;
    const gstin = validateGstin(form.gstin ?? "");
    if (gstin) errors["gstin"] = gstin;
    const pan = validatePan(form.pan ?? "");
    if (pan) errors["pan"] = pan;
    const pincode = validatePincode(form.pincode ?? "");
    if (pincode) errors["pincode"] = pincode;
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

  function setFieldError(field: string, message: string | null) {
    setFieldErrors((e) => ({ ...e, [field]: message ?? "" }));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New contact"
        description="Add a customer or vendor contact."
        backTo="/contacts"
        crumbs={[
          { label: "Master Data" },
          { label: "Contacts", to: "/contacts" },
          { label: "New contact" },
        ]}
      />
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <FormSection title="Contact details">
          <ErrorBanner message={formError} />
          <FormGrid>
            <Field
              label="Name"
              htmlFor="name"
              required
              error={fieldErrors["name"] ?? null}
              errorId="name-error"
            >
              <Input
                id="name"
                value={form["name"]}
                onChange={(e) => setField("name", e.target.value)}
                onBlur={() => setFieldError("name", validateRequired(form["name"], "Name"))}
                aria-invalid={!!fieldErrors["name"]}
                aria-describedby={fieldErrors["name"] ? "name-error" : undefined}
                required
              />
            </Field>
            <Field
              label="Email"
              htmlFor="email"
              required
              error={fieldErrors["email"] ?? null}
              errorId="email-error"
            >
              <Input
                id="email"
                type="email"
                value={form["email"]}
                onChange={(e) => setField("email", e.target.value)}
                onBlur={() => setFieldError("email", validateEmail(form["email"]))}
                aria-invalid={!!fieldErrors["email"]}
                aria-describedby={fieldErrors["email"] ? "email-error" : undefined}
                required
              />
            </Field>
            <Field
              label="Phone"
              htmlFor="phone"
              error={fieldErrors["phone"] ?? null}
              errorId="phone-error"
            >
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                onBlur={() => setFieldError("phone", validateMobile(form.phone ?? ""))}
                aria-invalid={!!fieldErrors["phone"]}
                aria-describedby={fieldErrors["phone"] ? "phone-error" : undefined}
              />
            </Field>
            <Field label="Photo" htmlFor="image_url" error={fieldErrors["image_url"] ?? null}>
              <ImageUpload
                value={form.image_url ?? ""}
                onChange={(url) => setField("image_url", url)}
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
                    <SelectItem key={t} value={t}>
                      {enumLabel(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field
              label="GSTIN"
              htmlFor="gstin"
              error={fieldErrors["gstin"] ?? null}
              errorId="gstin-error"
            >
              <Input
                id="gstin"
                value={form.gstin}
                onChange={(e) => setField("gstin", e.target.value)}
                onBlur={() => setFieldError("gstin", validateGstin(form.gstin ?? ""))}
                aria-invalid={!!fieldErrors["gstin"]}
                aria-describedby={fieldErrors["gstin"] ? "gstin-error" : undefined}
                placeholder="e.g. 07AABCU9603R1ZM"
              />
            </Field>
            <Field label="PAN" htmlFor="pan" error={fieldErrors["pan"] ?? null} errorId="pan-error">
              <Input
                id="pan"
                value={form.pan}
                onChange={(e) => setField("pan", e.target.value)}
                onBlur={() => setFieldError("pan", validatePan(form.pan ?? ""))}
                aria-invalid={!!fieldErrors["pan"]}
                aria-describedby={fieldErrors["pan"] ? "pan-error" : undefined}
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
            <Field
              label="Pincode"
              htmlFor="pincode"
              error={fieldErrors["pincode"] ?? null}
              errorId="pincode-error"
            >
              <Input
                id="pincode"
                value={form.pincode}
                onChange={(e) => setField("pincode", e.target.value)}
                onBlur={() => setFieldError("pincode", validatePincode(form.pincode ?? ""))}
                aria-invalid={!!fieldErrors["pincode"]}
                aria-describedby={fieldErrors["pincode"] ? "pincode-error" : undefined}
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
