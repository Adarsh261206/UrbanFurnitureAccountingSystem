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
import {
  validateConfirmPassword,
  validateEmail,
  validateLoginId,
  validatePassword,
  validateRequired,
} from "@/lib/validation";
import { enumLabel } from "@/lib/labels";
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
  const [errors, setErrors] = useState<{
    name: string | null;
    login_id: string | null;
    email: string | null;
    role: string | null;
    password: string | null;
    confirm_password: string | null;
  }>({
    name: null,
    login_id: null,
    email: null,
    role: null,
    password: null,
    confirm_password: null,
  });

  function clearError(field: keyof typeof errors) {
    setErrors((prev) => ({ ...prev, [field]: null }));
  }

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
          const nextErrors = {
            name: validateRequired(name, "Name"),
            login_id: validateRequired(loginId, "Login ID") ?? validateLoginId(loginId),
            email: validateRequired(email, "Email") ?? validateEmail(email),
            role: validateRequired(role, "Role"),
            password: validateRequired(password, "Password") ?? validatePassword(password),
            confirm_password:
              validateRequired(confirmPassword, "Confirm password") ??
              validateConfirmPassword(password, confirmPassword),
          };
          setErrors(nextErrors);
          if (Object.values(nextErrors).some(Boolean)) return;
          mutation.mutate();
        }}
      >
        <FormSection title="User details">
          <FormGrid>
            <Field label="Name" htmlFor="name" required error={errors.name}>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearError("name");
                }}
                onBlur={() =>
                  setErrors((prev) => ({ ...prev, name: validateRequired(name, "Name") }))
                }
                aria-invalid={!!errors.name}
                required
              />
            </Field>
            <Field label="Login ID" htmlFor="login_id" required error={errors.login_id}>
              <Input
                id="login_id"
                value={loginId}
                onChange={(e) => {
                  setLoginId(e.target.value);
                  clearError("login_id");
                }}
                onBlur={() =>
                  setErrors((prev) => ({ ...prev, login_id: validateLoginId(loginId) }))
                }
                aria-invalid={!!errors.login_id}
                required
              />
            </Field>
            <Field label="Email" htmlFor="email" required error={errors.email}>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError("email");
                }}
                onBlur={() => setErrors((prev) => ({ ...prev, email: validateEmail(email) }))}
                aria-invalid={!!errors.email}
                required
              />
            </Field>
            <Field label="Role" htmlFor="role" required error={errors.role}>
              <Select
                value={role}
                onValueChange={(v) => {
                  setRole(v as Role);
                  clearError("role");
                }}
              >
                <SelectTrigger id="role" aria-invalid={!!errors.role}>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {enumLabel(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Password" htmlFor="password" required error={errors.password}>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError("password");
                }}
                onBlur={() =>
                  setErrors((prev) => ({ ...prev, password: validatePassword(password) }))
                }
                aria-invalid={!!errors.password}
                required
              />
            </Field>
            <Field
              label="Confirm password"
              htmlFor="confirm_password"
              required
              error={errors.confirm_password}
            >
              <Input
                id="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearError("confirm_password");
                }}
                onBlur={() =>
                  setErrors((prev) => ({
                    ...prev,
                    confirm_password: validateConfirmPassword(password, confirmPassword),
                  }))
                }
                aria-invalid={!!errors.confirm_password}
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
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Create user"}
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
