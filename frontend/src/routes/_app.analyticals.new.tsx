import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { FormSection, Field, FormGrid, FormActions, ErrorBanner } from "@/components/common/FormLayout";
import { DataTable, type Column } from "@/components/common/DataTable";
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
import { date as fmtDate } from "@/lib/format";
import type { Analytical } from "@/types/api";

export const Route = createFileRoute("/_app/analyticals/new")({
  head: () => ({
    meta: [
      { title: "New analytical account — Urban Furniture Accounting" },
      { name: "description", content: "New analytical account in the Urban Furniture Accounting System." },
      { property: "og:title", content: "New analytical account — Urban Furniture Accounting" },
      { property: "og:description", content: "New analytical account in the Urban Furniture Accounting System." },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin", "accountant"]}>
      <Page />
    </RequireRole>
  ),
});

function Page() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [analyticAccount, setAnalyticAccount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const contactsQuery = useQuery({
    queryKey: ["contacts", "all-for-select"],
    queryFn: () => contactsService.list({ limit: 200 }),
  });
  const listQuery = useQuery({ queryKey: ["analyticals"], queryFn: () => analyticalsService.list() });

  const canSubmit =
    name.trim().length > 0 &&
    responsibleId !== "" &&
    startDate !== "" &&
    toDate !== "" &&
    endDate !== "" &&
    analyticAccount.trim().length > 0;

  const mutation = useMutation({
    mutationFn: () =>
      analyticalsService.create({
        name: name.trim(),
        responsible_id: responsibleId,
        start_date: startDate,
        to_date: toDate,
        end_date: endDate,
        analytic_account: analyticAccount.trim(),
      }),
    onSuccess: () => {
      toast.success("Analytical account created");
      queryClient.invalidateQueries({ queryKey: ["analyticals"] });
      setName("");
      setResponsibleId("");
      setStartDate("");
      setToDate("");
      setEndDate("");
      setAnalyticAccount("");
    },
    onError: (e) => setError(errorMessage(e)),
  });

  const columns: Column<Analytical>[] = [
    { key: "name", header: "Name", cell: (r) => (
        <Link to="/analyticals/$id" params={{ id: r.id }} className="font-medium text-primary hover:underline">
          {r.name}
        </Link>
      ) },
    { key: "analytic_account", header: "Analytic account", cell: (r) => r.analytic_account },
    { key: "start_date", header: "Start", cell: (r) => fmtDate(r.start_date) },
    { key: "end_date", header: "End", cell: (r) => fmtDate(r.end_date) },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Analytical accounts" description="Track budgets and costs by analytic dimension." />

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          if (canSubmit) mutation.mutate();
        }}
      >
        <FormSection title="New analytical account">
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
              <Input id="start_date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </Field>
            <Field label="To date" htmlFor="to_date" required>
              <Input id="to_date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} required />
            </Field>
            <Field label="End date" htmlFor="end_date" required>
              <Input id="end_date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
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
          <Button type="submit" disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Create analytical account"}
          </Button>
        </FormActions>
      </form>

      <FormSection title="All analytical accounts">
        {listQuery.isLoading ? (
          <LoadingState label="Loading analytical accounts" />
        ) : listQuery.isError ? (
          <ErrorState error={listQuery.error} onRetry={() => listQuery.refetch()} />
        ) : listQuery.data && listQuery.data.length > 0 ? (
          <DataTable columns={columns} rows={listQuery.data} rowKey={(r) => r.id} caption="Analytical accounts" />
        ) : (
          <EmptyState title="No analytical accounts yet" description="Create one using the form above." />
        )}
      </FormSection>
    </div>
  );
}
