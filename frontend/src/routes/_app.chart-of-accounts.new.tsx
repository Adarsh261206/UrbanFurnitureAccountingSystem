import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { FormSection, Field, FormActions, ErrorBanner } from "@/components/common/FormLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { accountsService } from "@/services/masterDataService";
import { errorMessage } from "@/lib/api/errors";
import type { AccountType } from "@/types/api";

export const Route = createFileRoute("/_app/chart-of-accounts/new")({
  head: () => ({
    meta: [
      { title: "New account — Urban Furniture Accounting" },
      { name: "description", content: "New account in the Urban Furniture Accounting System." },
      { property: "og:title", content: "New account — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "New account in the Urban Furniture Accounting System.",
      },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin", "accountant"]}>
      <Page />
    </RequireRole>
  ),
});

const ACCOUNT_TYPES: AccountType[] = [
  "asset",
  "liability",
  "bank",
  "capital",
  "cash",
  "income",
  "expense",
];

function Page() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<AccountType | "">("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      accountsService.create({ name: name.trim(), account_type: accountType as AccountType }),
    onSuccess: () => {
      toast.success("Account created");
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
      navigate({ to: "/chart-of-accounts" });
    },
    onError: (e) => setError(errorMessage(e)),
  });

  const canSubmit = name.trim().length > 0 && accountType !== "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="New account"
        description="Add a ledger account to the chart of accounts."
        backTo="/chart-of-accounts"
        crumbs={[
          { label: "Account" },
          { label: "Chart of Accounts", to: "/chart-of-accounts" },
          { label: "New account" },
        ]}
      />
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          if (canSubmit) mutation.mutate();
        }}
      >
        <FormSection title="Account details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="name" required>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Account type" htmlFor="account_type" required>
              <Select value={accountType} onValueChange={(v) => setAccountType(v as AccountType)}>
                <SelectTrigger id="account_type">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </FormSection>

        <ErrorBanner message={error} />

        <FormActions>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/chart-of-accounts" })}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Create account"}
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
