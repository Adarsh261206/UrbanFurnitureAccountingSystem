import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { RedirectIfAuthenticated } from "@/components/guards/RouteGuards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/authService";
import { errorMessage } from "@/lib/api/errors";
import {
  validateConfirmPassword,
  validateEmail,
  validateLoginId,
  validatePassword,
  validateRequired,
} from "@/lib/validation";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — Urban Furniture Accounting" },
      {
        name: "description",
        content:
          "Create an Urban Furniture Accounting System account to track invoices, payments and ledgers.",
      },
      { property: "og:title", content: "Create account — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "Register for the Urban Furniture accounting workspace.",
      },
    ],
  }),
  component: () => (
    <RedirectIfAuthenticated>
      <SignupPage />
    </RedirectIfAuthenticated>
  ),
});

function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    login_id: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<{
    name: string | null;
    login_id: string | null;
    email: string | null;
    password: string | null;
    confirm_password: string | null;
  }>({ name: null, login_id: null, email: null, password: null, confirm_password: null });

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const nextErrors = {
      name: validateRequired(form.name, "Name"),
      login_id: validateLoginId(form.login_id),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirm_password: validateConfirmPassword(form.password, form.confirm_password),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    setSubmitting(true);
    setError(null);
    try {
      // Signup does not create a session (22 §4) — the account must be
      // approved by an administrator before the user can sign in.
      await authService.signup({ ...form, login_id: form.login_id.trim() });
      setDone(true);
    } catch (err) {
      setError(err);
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Signing up does not sign you in — you'll be asked to log in afterwards."
      footer={
        <span>
          Already registered?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </span>
      }
    >
      {done ? (
        <div className="space-y-4 rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-center">
          <p className="text-2xl">🎉</p>
          <h2 className="text-base font-bold text-foreground">Request received!</h2>
          <p className="text-sm text-muted-foreground">
            Your account is <strong>pending administrator approval</strong>. Once approved you will
            receive an email and will be able to sign in.
          </p>
          <Link
            to="/login"
            className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-[#5e3c55]"
          >
            Go to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              autoComplete="name"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              onBlur={() =>
                setErrors((prev) => ({ ...prev, name: validateRequired(form.name, "Name") }))
              }
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name ? (
              <p id="name-error" className="text-xs font-medium text-destructive">
                {errors.name}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="login_id">Login ID</Label>
            <Input
              id="login_id"
              autoComplete="username"
              required
              value={form.login_id}
              onChange={(e) => set("login_id", e.target.value)}
              onBlur={() =>
                setErrors((prev) => ({ ...prev, login_id: validateLoginId(form.login_id) }))
              }
              aria-invalid={!!errors.login_id}
              aria-describedby={errors.login_id ? "login_id-error" : undefined}
            />
            {errors.login_id ? (
              <p id="login_id-error" className="text-xs font-medium text-destructive">
                {errors.login_id}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              onBlur={() => setErrors((prev) => ({ ...prev, email: validateEmail(form.email) }))}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email ? (
              <p id="email-error" className="text-xs font-medium text-destructive">
                {errors.email}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              onBlur={() =>
                setErrors((prev) => ({ ...prev, password: validatePassword(form.password) }))
              }
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password ? (
              <p id="password-error" className="text-xs font-medium text-destructive">
                {errors.password}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm_password">Confirm password</Label>
            <Input
              id="confirm_password"
              type="password"
              autoComplete="new-password"
              required
              value={form.confirm_password}
              onChange={(e) => set("confirm_password", e.target.value)}
              onBlur={() =>
                setErrors((prev) => ({
                  ...prev,
                  confirm_password: validateConfirmPassword(form.password, form.confirm_password),
                }))
              }
              aria-invalid={!!errors.confirm_password}
              aria-describedby={errors.confirm_password ? "confirm_password-error" : undefined}
            />
            {errors.confirm_password ? (
              <p id="confirm_password-error" className="text-xs font-medium text-destructive">
                {errors.confirm_password}
              </p>
            ) : null}
          </div>
          {error ? (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {errorMessage(error)}
            </p>
          ) : null}
          <Button type="submit" className="h-9 w-full text-sm" disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Create
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
