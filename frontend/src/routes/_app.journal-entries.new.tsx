import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
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
      {
        name: "description",
        content: "New journal entry in the Urban Furniture Accounting System.",
      },
      { property: "og:title", content: "New journal entry — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "New journal entry in the Urban Furniture Accounting System.",
      },
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
  const accountsQuery = useQuery({
    queryKey: ["chart-of-accounts"],
    queryFn: () => accountsService.list(),
  });
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
      return (
        l.account_id !== "" &&
        debit >= 0 &&
        credit >= 0 &&
        (debit > 0 || credit > 0) &&
        !(debit > 0 && credit > 0)
      );
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
      <PageHeader
        title="New journal entry"
        crumbs={[
          { label: "Accounting" },
          { label: "Journal Entries", to: "/journal-entries" },
          { label: "New journal entry" },
        ]}
        description="Record a manual accounting entry."
        actions={
          <Button variant="outline" onClick={() => navigate({ to: "/journal-entries" })}>
            Back
          </Button>
        }
      />

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
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </Field>
          </FormGrid>
        </FormSection>

        <FormSection
          title="Journal lines"
          description="Each line must have either a debit or a credit amount. Total debit must equal total credit."
        >
          <div className="overflow-hidden rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      #
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      Account
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      Partner
                    </th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      Debit
                    </th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      Credit
                    </th>
                    <th className="w-12 px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, idx) => (
                    <tr key={line.key} className="border-b last:border-0">
                      <td className="px-3 py-2 text-[13px] text-muted-foreground">{idx + 1}</td>
                      <td className="min-w-[200px] px-3 py-2">
                        <Select
                          value={line.account_id}
                          onValueChange={(v) => updateLine(line.key, { account_id: v })}
                        >
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
                      </td>
                      <td className="min-w-[180px] px-3 py-2">
                        <Select
                          value={line.partner_id || "none"}
                          onValueChange={(v) =>
                            updateLine(line.key, { partner_id: v === "none" ? "" : v })
                          }
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
                      </td>
                      <td className="w-32 px-3 py-2">
                        <Input
                          id={`debit-${line.key}`}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="text-right"
                          value={line.debit}
                          onChange={(e) =>
                            updateLine(line.key, {
                              debit: e.target.value,
                              credit: e.target.value ? "" : line.credit,
                            })
                          }
                        />
                      </td>
                      <td className="w-32 px-3 py-2">
                        <Input
                          id={`credit-${line.key}`}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="text-right"
                          value={line.credit}
                          onChange={(e) =>
                            updateLine(line.key, {
                              credit: e.target.value,
                              debit: e.target.value ? "" : line.debit,
                            })
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={lines.length <= 2}
                          onClick={() => removeLine(line.key)}
                          aria-label={`Remove line ${idx + 1}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t bg-muted/40 px-4 py-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLines((prev) => [...prev, newLine()])}
              >
                <Plus className="size-4" /> Add line
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
              <span className="text-muted-foreground">
                Total debit:{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {money(totals.debit)}
                </span>
              </span>
              <span className="text-muted-foreground">
                Total credit:{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {money(totals.credit)}
                </span>
              </span>
              <span className="text-muted-foreground">
                Balance:{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {money(Math.abs(totals.debit - totals.credit))}
                </span>
              </span>
              <span className={balanced ? "text-success" : "text-destructive"}>
                {balanced ? "Balanced" : "Unbalanced"}
              </span>
            </div>
          </div>
        </FormSection>

        <ErrorBanner message={error} />

        <FormActions>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/journal-entries" })}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending ? "Submitting…" : "Confirm entry"}
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
