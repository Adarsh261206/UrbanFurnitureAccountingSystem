import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { ErrorState, LoadingState } from "@/components/common/States";
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
import { contactsService, type ContactInput } from "@/services/masterDataService";
import { normalizeError, errorMessage } from "@/lib/api/errors";
import { date as fmtDate } from "@/lib/format";
import { toast } from "sonner";
import type { Contact, ContactType } from "@/types/api";
import { enumLabel } from "@/lib/labels";
import {
  validateRequired,
  validateEmail,
  validateMobile,
  validateGstin,
  validatePan,
  validatePincode,
} from "@/lib/validation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const CONTACT_TYPES: ContactType[] = ["customer", "vendor", "both"];

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
    contact_type: c.contact_type,
    gstin: c.gstin ?? "",
    pan: c.pan ?? "",
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
  const [deleteOpen, setDeleteOpen] = useState(false);

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

  const deleteMutation = useMutation({
    mutationFn: () => contactsService.delete(id),
    onSuccess: () => {
      toast.success("Contact deleted");
      void navigate({ to: "/contacts" });
    },
    onError: (error) => {
      setDeleteOpen(false);
      toast.error(errorMessage(error));
    },
  });

  function setField<K extends keyof ContactInput>(key: K, value: ContactInput[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setFieldErrors((e) => ({ ...e, [key]: "" }));
  }

  function setFieldError(field: string, message: string | null) {
    setFieldErrors((e) => ({ ...e, [field]: message ?? "" }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form) return;
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
        backTo="/contacts"
        crumbs={[{ label: "Master Data" }, { label: "Contacts", to: "/contacts" }]}
        description={`Created ${fmtDate(query.data.created_at)}`}
        actions={
          <>
            <Button
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: "/contacts" })}>
              Back to contacts
            </Button>
          </>
        }
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
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </FormActions>
        </FormSection>
      </form>

      <ConfirmationModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this contact?"
        description={
          <>
            This will permanently remove <strong>{query.data.name}</strong> from your contacts.
            Existing invoices, bills and orders keep their history. This cannot be undone.
          </>
        }
        confirmLabel="Delete contact"
        destructive
        pending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
