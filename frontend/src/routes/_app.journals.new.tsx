import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
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
import { accountsService, journalsService } from "@/services/masterDataService";
import { normalizeError, errorMessage } from "@/lib/api/errors";
import type { JournalType } from "@/types/api";

export const Route = createFileRoute("/_app/journals/new")({
  head: () => ({
    meta: [
      { title: "New journal — Urban Furniture Accounting" },
      { name: "description", content: "New journal in the Urban Furniture Accounting System." },
      { property: "og:title", content: "New journal — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "New journal in the Urban Furniture Accounting System.",
      },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin", "accountant"]}>
      <Page />
    </RequireRole>
  ),
});

const JOURNAL_TYPES: JournalType[] = ["sale", "purchase", "bank", "cash"];

function Page() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [journalType, setJournalType] = useState<JournalType | "">("");
  const [defaultAccountId, setDefaultAccountId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const accountsQuery = useQuery({
    queryKey: ["chart-of-accounts"],
    queryFn: () => accountsService.list(),
  });

  const mutation = useMutation({
    mutationFn: () =>
      journalsService.create({
        name: name.trim(),
        journal_type: journalType as JournalType,
        default_account_id: defaultAccountId,
      }),
    onSuccess: () => {
      toast.success("Journal created");
      void navigate({ to: "/journals" });
    },
    onError: (error) => {
      const normalized = normalizeError(error);
      if (normalized.field) setFieldErrors({ [normalized.field]: normalized.message });
      else setFormError(errorMessage(error));
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Name is required";
    if (!journalType) errors.journal_type = "Journal type is required";
    if (!defaultAccountId) errors.default_account_id = "Default account is required";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    mutation.mutate();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New journal"
        crumbs={[{ label: "Accounting" }, { label: "Journals", to: "/journals" }, { label: "New journal" }]}
        description="Create a journal for a specific accounting flow."
      />
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <FormSection title="Journal details">
          <ErrorBanner message={formError} />
          <FormGrid>
            <Field label="Name" htmlFor="name" required error={fieldErrors.name ?? null}>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sales Journal"
                required
              />
            </Field>
            <Field
              label="Journal type"
              htmlFor="journal_type"
              required
              error={fieldErrors.journal_type ?? null}
            >
              <Select value={journalType} onValueChange={(v) => setJournalType(v as JournalType)}>
                <SelectTrigger id="journal_type" aria-label="Journal type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {JOURNAL_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field
              label="Default account"
              htmlFor="default_account_id"
              required
              error={fieldErrors.default_account_id ?? null}
            >
              <Select value={defaultAccountId} onValueChange={setDefaultAccountId}>
                <SelectTrigger id="default_account_id" aria-label="Default account">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {(accountsQuery.data ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} · {a.account_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FormGrid>
          <FormActions>
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/journals" })}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create journal"}
            </Button>
          </FormActions>
        </FormSection>
      </form>
    </div>
  );
}
