import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { FormSection, Field, FormGrid, FormActions, ErrorBanner } from "@/components/common/FormLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  journalEntriesService,
  journalsService,
  accountsService,
  contactsService,
  type JournalEntryLineInput,
} from "@/services/masterDataService";
import { errorMessage } from "@/lib/api/errors";
import { money, today } from "@/lib/format";

export const Route = createFileRoute("/_app/journal-entries/new")({
  head: () => ({
    meta: [
      { title: "New journal entry — Urban Furniture Accounting" },
      { name: "description", content: "New journal entry in the Urban Furniture Accounting System." },
      { property: "og:title", content: "New journal entry — Urban Furniture Accounting" },
      { property: "og:description", content: "New journal entry in the Urban Furniture Accounting System." },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin", "accountant"]}>
      <Page />
    </RequireRole>
  ),
});

interface LineRow {
  key: string;
  account_id: string;
  partner_id: string;
  debit: string;
  credit: string;
}

function newLine(): LineRow {
  return { key: crypto.randomUUID(), account_id: "", partner_id: "", debit: "", credit: "" };
}

function Page() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [journalId, setJournalId] = useState("");
  const [accountingDate, setAccountingDate] = useState(today());
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState<LineRow[]>([newLine(), newLine()]);
  const [error, setError] = useState<string | null>(null);

  const journalsQuery = useQuery({ queryKey: ["journals"], queryFn: () => journalsService.list() });
  const accountsQuery = useQuery({ queryKey: ["chart-of-accounts"], queryFn: () => accountsService.list() });
  const contactsQuery = useQuery({
    queryKey: ["contacts", "all-for-select"],
    queryFn: () => contactsService.list({ limit: 200 }),
  });

  const updateLine = (key: string, patch: Partial<LineRow>) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };

  const removeLine = (key: string) => {
    setLines((prev) => (prev.length > 2 ? prev.filter((l) => l.key !== key) : prev));
  };

  const totals = useMemo(() => {
    const debit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const credit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
    return { debit, credit };
  }, [lines]);

  const balanced = totals.debit > 0 && Math.abs(totals.debit - totals.credit) < 0.005;

  const linesValid =
    lines.length >= 2 &&
    lines.every((l) => {
      const debit = Number(l.debit) || 0;
      const credit = Number(l.credit) || 0;
      return l.account_id !== "" && debit >= 0 && credit >= 0 && (debit > 0 || credit > 0) && !(debit > 0 && credit > 0);
    });

  const canSubmit = journalId !== "" && accountingDate !== "" && linesValid && balanced;

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        journal_id: journalId,
        accounting_date: accountingDate,
        reference: reference.trim() || undefined,
        lines: lines.map<JournalEntryLineInput>((l) => ({
          account_id: l.account_id,
          partner_id: l.partner_id || undefined,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
        })),
      };
      return journalEntriesService.create(body);
    },
    onSuccess: () => {
      toast.success("Journal entry created");
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      navigate({ to: "/journal-entries" });
    },
    onError: (e) => setError(errorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="New journal entry" description="Record a manual accounting entry." />

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          if (canSubmit) mutation.mutate();
        }}
      >
        <FormSection title="Entry details">
          <FormGrid>
            <Field label="Journal" htmlFor="journal_id" required>
              <Select value={journalId} onValueChange={setJournalId}>
                <SelectTrigger id="journal_id">
                  <SelectValue placeholder="Select journal" />
                </SelectTrigger>
                <SelectContent>
                  {journalsQuery.data?.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Accounting date" htmlFor="accounting_date" required>
              <Input
                id="accounting_date"
                type="date"
                value={accountingDate}
                onChange={(e) => setAccountingDate(e.target.value)}
                required
              />
            </Field>
            <Field label="Reference" htmlFor="reference">
              <Input id="reference" value={reference} onChange={(e) => setReference(e.target.value)} />
            </Field>
          </FormGrid>
        </FormSection>

        <FormSection
          title="Lines"
          description="Each line must have either a debit or a credit amount. Total debit must equal total credit."
        >
          <div className="space-y-3">
            {lines.map((line, idx) => (
              <div key={line.key} className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-[2fr_2fr_1fr_1fr_auto]">
                <Field label="Account" htmlFor={`account-${line.key}`} required className="sm:mb-0">
                  <Select value={line.account_id} onValueChange={(v) => updateLine(line.key, { account_id: v })}>
                    <SelectTrigger id={`account-${line.key}`}>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accountsQuery.data?.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Partner" htmlFor={`partner-${line.key}`}>
                  <Select
                    value={line.partner_id || "none"}
                    onValueChange={(v) => updateLine(line.key, { partner_id: v === "none" ? "" : v })}
                  >
                    <SelectTrigger id={`partner-${line.key}`}>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {contactsQuery.data?.contacts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Debit" htmlFor={`debit-${line.key}`}>
                  <Input
                    id={`debit-${line.key}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.debit}
                    onChange={(e) => updateLine(line.key, { debit: e.target.value, credit: e.target.value ? "" : line.credit })}
                  />
                </Field>
                <Field label="Credit" htmlFor={`credit-${line.key}`}>
                  <Input
                    id={`credit-${line.key}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.credit}
                    onChange={(e) => updateLine(line.key, { credit: e.target.value, debit: e.target.value ? "" : line.debit })}
                  />
                </Field>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={lines.length <= 2}
                    onClick={() => removeLine(line.key)}
                    aria-label={`Remove line ${idx + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" className="mt-3" onClick={() => setLines((prev) => [...prev, newLine()])}>
            <Plus className="size-4" /> Add line
          </Button>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-6 border-t border-border pt-4 text-sm">
            <span>
              Total debit: <span className="font-medium tabular-nums text-foreground">{money(totals.debit)}</span>
            </span>
            <span>
              Total credit: <span className="font-medium tabular-nums text-foreground">{money(totals.credit)}</span>
            </span>
            <span
              className={
                balanced
                  ? "rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                  : "rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive"
              }
            >
              {balanced ? "Balanced" : `Unbalanced (${Math.abs(totals.debit - totals.credit).toFixed(2)})`}
            </span>
          </div>
        </FormSection>

        <ErrorBanner message={error} />

        <FormActions>
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/journal-entries" })}>
            Back
          </Button>
          <Button type="submit" disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending ? "Submitting…" : "Confirm"}
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
