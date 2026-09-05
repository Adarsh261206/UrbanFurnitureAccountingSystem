import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { DataTable, TablePagination, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usersService } from "@/services/masterDataService";
import type { User } from "@/types/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/users/")({
  head: () => ({
    meta: [
      { title: "Users — Urban Furniture Accounting" },
      { name: "description", content: "Users in the Urban Furniture Accounting System." },
      { property: "og:title", content: "Users — Urban Furniture Accounting" },
      { property: "og:description", content: "Users in the Urban Furniture Accounting System." },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin"]}>
      <Page />
    </RequireRole>
  ),
});

const LIMIT = 20;

function ApprovalBadge({ status }: { status: User["approval_status"] }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        status === "pending" && "bg-amber-500/10 text-amber-600",
        status === "approved" && "bg-emerald-500/10 text-emerald-600",
        status === "rejected" && "bg-red-500/10 text-red-600",
      )}
    >
      {status ?? "approved"}
    </span>
  );
}

function Page() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useMemo(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const query = useQuery({
    queryKey: ["users", page, debounced],
    queryFn: () => usersService.list({ page, limit: LIMIT, search: debounced || undefined }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => usersService.approve(id),
    onSuccess: () => {
      toast.success("User approved — email sent");
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => usersService.reject(id),
    onSuccess: () => {
      toast.success("User rejected");
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Name",
      cell: (r) => <span className="font-medium text-foreground">{r.name ?? "—"}</span>,
    },
    { key: "login_id", header: "Login ID", cell: (r) => r.login_id },
    { key: "email", header: "Email", cell: (r) => r.email },
    { key: "role", header: "Role", cell: (r) => <StatusBadge status={r.role} /> },
    {
      key: "approval_status",
      header: "Approval",
      cell: (r) => <ApprovalBadge status={r.approval_status ?? "approved"} />,
    },
    {
      key: "actions",
      header: "",
      cell: (r) =>
        r.approval_status === "pending" ? (
          <span className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="text-emerald-600 hover:text-emerald-700"
              disabled={approveMutation.isPending}
              onClick={(e) => {
                e.stopPropagation();
                approveMutation.mutate(r.id);
              }}
            >
              <Check className="size-3.5" /> Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              disabled={rejectMutation.isPending}
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Reject account "${r.login_id}"?`)) rejectMutation.mutate(r.id);
              }}
            >
              <X className="size-3.5" /> Reject
            </Button>
          </span>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        crumbs={[{ label: "Administration" }, { label: "Users" }]}
        description="Manage accounts that can sign in to the system."
        actions={
          <Button onClick={() => navigate({ to: "/users/new" })}>
            <Plus className="size-4" /> New user
          </Button>
        }
      />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users by name or email…"
          className="pl-9"
          aria-label="Search users"
        />
      </div>

      {query.isLoading ? (
        <LoadingState label="Loading users" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data && query.data.users.length > 0 ? (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            rows={query.data.users}
            rowKey={(r) => r.id}
            caption="Users"
          />
          <TablePagination
            page={page}
            limit={LIMIT}
            total={query.data.total}
            onPageChange={setPage}
          />
        </div>
      ) : (
        <EmptyState
          title="No users found"
          description="Create a user account to grant access to the system."
          action={
            <Button onClick={() => navigate({ to: "/users/new" })}>
              <Plus className="size-4" /> New user
            </Button>
          }
        />
      )}
    </div>
  );
}
