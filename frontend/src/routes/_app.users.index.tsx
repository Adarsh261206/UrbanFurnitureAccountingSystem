import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { DataTable, TablePagination, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usersService } from "@/services/masterDataService";
import type { User } from "@/types/api";

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

function Page() {
  const navigate = useNavigate();
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

  const columns: Column<User>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium text-foreground">{r.name ?? "—"}</span> },
    { key: "login_id", header: "Login ID", cell: (r) => r.login_id },
    { key: "email", header: "Email", cell: (r) => r.email },
    { key: "role", header: "Role", cell: (r) => <StatusBadge status={r.role} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
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
          <DataTable columns={columns} rows={query.data.users} rowKey={(r) => r.id} caption="Users" />
          <TablePagination page={page} limit={LIMIT} total={query.data.total} onPageChange={setPage} />
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
