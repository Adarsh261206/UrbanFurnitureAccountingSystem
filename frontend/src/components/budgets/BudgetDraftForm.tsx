import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { budgetsService } from "@/services/budgetsService";
import { contactsService, analyticalsService } from "@/services/masterDataService";
import { errorMessage } from "@/lib/api/errors";
import type { BudgetDetail, BudgetType } from "@/types/api";

/**
 * Original / Revised budget form (PUT /budgets/:id — draft only).
 * A budget with previous_budget_id is a revision created by POST /budgets/:id/revise.
 */
export function BudgetDraftForm({ budget }: { budget: BudgetDetail }) {
  const queryClient = useQueryClient();
  const isRevision = budget.previous_budget_id !== null;

  const [name, setName] = useState(budget.name);
  const [responsibleId, setResponsibleId] = useState(budget.responsible?.id ?? "");
  const [analyticalId, setAnalyticalId] = useState(budget.analytical?.id ?? "");
  const [type, setType] = useState<BudgetType>(budget.type);
  const [startDate, setStartDate] = useState(budget.start_date.slice(0, 10));
  const [endDate, setEndDate] = useState(budget.end_date.slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  const contactsQuery = useQuery({
    queryKey: ["contacts", "all-for-select"],
    queryFn: () => contactsService.list({ limit: 200 }),
  });
  const analyticalsQuery = useQuery({
    queryKey: ["analyticals"],
    queryFn: () => analyticalsService.list(),
  });

  const canSubmit =
    name.trim().length > 0 &&
    responsibleId !== "" &&
    analyticalId !== "" &&
    startDate !== "" &&
    endDate !== "";

  const mutation = useMutation({
    mutationFn: () =>
      budgetsService.update(budget.id, {
        name: name.trim(),
        responsible_id: responsibleId,
        analytical_id: analyticalId,
        type,
        start_date: startDate,
        end_date: endDate,
      }),
    onSuccess: () => {
      toast.success("Budget saved");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: (e) => setError(errorMessage(e)),
  });

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        if (canSubmit) mutation.mutate();
      }}
    >
      <FormSection
        title={isRevision ? "Revised budget" : "Original budget"}
        description={
          isRevision
            ? "This draft revises a previously confirmed budget. Edit and confirm it."
            : "Draft budget details. Editable until the budget is confirmed."
        }
      >
        <FormGrid>
          <Field label="Name" htmlFor="edit_name" required>
            <Input id="edit_name" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Responsible" htmlFor="edit_responsible_id" required>
            <Select value={responsibleId} onValueChange={setResponsibleId}>
              <SelectTrigger id="edit_responsible_id">
                <SelectValue placeholder="Select a contact" />
              </SelectTrigger>
              <SelectContent>
                {contactsQuery.data?.contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Type" htmlFor="edit_type" required>
            <Select value={type} onValueChange={(v) => setType(v as BudgetType)}>
              <SelectTrigger id="edit_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Analytical account" htmlFor="edit_analytical_id" required>
            <Select value={analyticalId} onValueChange={setAnalyticalId}>
              <SelectTrigger id="edit_analytical_id">
                <SelectValue placeholder="Select analytical account" />
              </SelectTrigger>
              <SelectContent>
                {analyticalsQuery.data?.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Start date" htmlFor="edit_start_date" required>
            <Input
              id="edit_start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </Field>
          <Field label="End date" htmlFor="edit_end_date" required>
            <Input
              id="edit_end_date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </Field>
        </FormGrid>
      </FormSection>

      <ErrorBanner message={error} />

      <FormActions>
        <Button type="submit" variant="outline" disabled={!canSubmit || mutation.isPending}>
          {mutation.isPending ? "Saving…" : "Save changes"}
        </Button>
      </FormActions>
    </form>
  );
}
