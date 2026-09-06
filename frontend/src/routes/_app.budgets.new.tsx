import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import type { BudgetType } from "@/types/api";

export const Route = createFileRoute("/_app/budgets/new")({
  head: () => ({
    meta: [
      { title: "New budget — Urban Furniture Accounting" },
      { name: "description", content: "New budget in the Urban Furniture Accounting System." },
      { property: "og:title", content: "New budget — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "New budget in the Urban Furniture Accounting System.",
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
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState<BudgetType | "">("");
  const [analyticalId, setAnalyticalId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [endDateError, setEndDateError] = useState<string | null>(null);

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
    startDate !== "" &&
    endDate !== "" &&
    type !== "" &&
    analyticalId !== "";

  const mutation = useMutation({
    mutationFn: () =>
      budgetsService.create({
        name: name.trim(),
        responsible_id: responsibleId,
        start_date: startDate,
        end_date: endDate,
        type: type as BudgetType,
        analytical_id: analyticalId,
      }),
    onSuccess: (budget) => {
      toast.success("Budget created");
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      navigate({ to: "/budgets/$id", params: { id: budget.id } });
    },
    onError: (e) => setError(errorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="New budget"
        description="Create a budget for an analytical account."
        backTo="/budgets"
        crumbs={[
          { label: "Accounting" },
          { label: "Budgets", to: "/budgets" },
          { label: "New budget" },
        ]}
      />
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          setEndDateError(null);
          if (!canSubmit) return;
          if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
            setEndDateError("End date cannot be before start date.");
            return;
          }
          mutation.mutate();
        }}
      >
        <FormSection title="Budget details">
          <FormGrid>
            <Field label="Name" htmlFor="name" required>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Responsible" htmlFor="responsible_id" required>
              <Select value={responsibleId} onValueChange={setResponsibleId}>
                <SelectTrigger id="responsible_id">
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
            <Field label="Type" htmlFor="type" required>
              <Select value={type} onValueChange={(v) => setType(v as BudgetType)}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Analytical account" htmlFor="analytical_id" required>
              <Select value={analyticalId} onValueChange={setAnalyticalId}>
                <SelectTrigger id="analytical_id">
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
            <Field label="Start date" htmlFor="start_date" required>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setEndDateError(null);
                }}
                required
              />
            </Field>
            <Field
              label="End date"
              htmlFor="end_date"
              required
              error={endDateError}
              errorId="end_date-error"
            >
              <Input
                id="end_date"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setEndDateError(null);
                }}
                aria-invalid={Boolean(endDateError)}
                aria-describedby={endDateError ? "end_date-error" : undefined}
                required
              />
            </Field>
          </FormGrid>
        </FormSection>

        <ErrorBanner message={error} />

        <FormActions>
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/budgets" })}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Create budget"}
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
