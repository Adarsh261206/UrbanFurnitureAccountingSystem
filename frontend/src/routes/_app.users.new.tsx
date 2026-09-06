import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { usersService } from "@/services/masterDataService";
import { errorMessage } from "@/lib/api/errors";
import type { Role } from "@/types/api";

export const Route = createFileRoute("/_app/users/new")({
  head: () => ({
    meta: [
      { title: "New user — Urban Furniture Accounting" },
      { name: "description", content: "New user in the Urban Furniture Accounting System." },
      { property: "og:title", content: "New user — Urban Furniture Accounting" },
      { property: "og:description", content: "New user in the Urban Furniture Accounting System." },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin"]}>
      <Page />
    </RequireRole>
  ),
});

const ROLES: Role[] = ["admin", "accountant", "user"];

function Page() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [loginId, setLoginId] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit =
    name.trim().length > 0 &&
    loginId.trim().length > 0 &&
    email.trim().length > 0 &&
    role !== "" &&
    passwordsMatch;

  const mutation = useMutation({
    mutationFn: () =>
      usersService.create({
        name: name.trim(),
        login_id: loginId.trim(),
        email: email.trim(),
        role: role as Role,
        password,
        confirm_password: confirmPassword,
      }),
    onSuccess: () => {
      toast.success("User created");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      navigate({ to: "/users" });
    },
    onError: (e) => setError(errorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="New user"
        description="Create an account with access to the system."
        backTo="/users"
        crumbs={[
          { label: "Administration" },
          { label: "Users", to: "/users" },
          { label: "New user" },
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
        <FormSection title="User details">
          <FormGrid>
            <Field label="Name" htmlFor="name" required>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Login ID" htmlFor="login_id" required>
              <Input
                id="login_id"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
              />
            </Field>
            <Field label="Email" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Role" htmlFor="role" required>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Password" htmlFor="password" required>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            <Field
              label="Confirm password"
              htmlFor="confirm_password"
              required
              error={
                confirmPassword.length > 0 && !passwordsMatch ? "Passwords do not match" : null
              }
            >
              <Input
                id="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </Field>
          </FormGrid>
        </FormSection>

        <ErrorBanner message={error} />

        <FormActions>
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/users" })}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Create user"}
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
