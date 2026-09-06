import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
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
import { analyticalsService, contactsService } from "@/services/masterDataService";
import { errorMessage } from "@/lib/api/errors";

export const Route = createFileRoute("/_app/analyticals/$id")({
  head: () => ({
    meta: [
      { title: "Analytical account — Urban Furniture Accounting" },
      {
        name: "description",
        content: "Analytical account in the Urban Furniture Accounting System.",
      },
      { property: "og:title", content: "Analytical account — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "Analytical account in the Urban Furniture Accounting System.",
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
  const { id } = useParams({ from: "/_app/analyticals/$id" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["analyticals"],
    queryFn: () => analyticalsService.list(),
  });
  const contactsQuery = useQuery({
    queryKey: ["contacts", "all-for-select"],
    queryFn: () => contactsService.list({ limit: 200 }),
  });

  const record = listQuery.data?.find((a) => a.id === id);

  const [name, setName] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [analyticAccount, setAnalyticAccount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [endDateError, setEndDateError] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      setName(record.name);
      setResponsibleId(record.responsible_id);
      setStartDate(record.start_date?.slice(0, 10) ?? "");
      setToDate(record.to_date?.slice(0, 10) ?? "");
      setEndDate(record.end_date?.slice(0, 10) ?? "");
      setAnalyticAccount(record.analytic_account);
    }
  }, [record]);

  const mutation = useMutation({
    mutationFn: () =>
      analyticalsService.update(id, {
        name: name.trim(),
        responsible_id: responsibleId,
        start_date: startDate,
        to_date: toDate,
        end_date: endDate,
        analytic_account: analyticAccount.trim(),
      }),
    onSuccess: () => {
      toast.success("Analytical account saved");
      queryClient.invalidateQueries({ queryKey: ["analyticals"] });
    },
    onError: (e) => setError(errorMessage(e)),
  });

  if (listQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytical account" />
        <LoadingState label="Loading analytical account" />
      </div>
    );
  }

  if (listQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytical account" />
        <ErrorState error={listQuery.error} onRetry={() => listQuery.refetch()} />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytical account" />
        <EmptyState
          title="Analytical account not found"
          description="This analytical account does not exist or has been removed."
          action={
            <Button variant="outline" onClick={() => navigate({ to: "/analyticals" })}>
              Back to analyticals
            </Button>
          }
        />
      </div>
    );
  }

  const canSubmit =
    name.trim().length > 0 &&
    responsibleId !== "" &&
    startDate !== "" &&
    toDate !== "" &&
    endDate !== "" &&
    analyticAccount.trim().length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={record.name}
        backTo="/analyticals"
        crumbs={[{ label: "Accounting" }, { label: "Analyticals", to: "/analyticals" }]}
        description="Edit analytical account details."
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
        <FormSection title="Analytical account">
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
            <Field label="To date" htmlFor="to_date" required>
              <Input
                id="to_date"
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
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
            <Field label="Analytic account" htmlFor="analytic_account" required>
              <Input
                id="analytic_account"
                value={analyticAccount}
                onChange={(e) => setAnalyticAccount(e.target.value)}
                required
              />
            </Field>
          </FormGrid>
        </FormSection>

        <ErrorBanner message={error} />

        <FormActions>
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/analyticals" })}>
            Back
          </Button>
          <Button type="submit" disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
