import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { RedirectIfAuthenticated } from "@/components/guards/RouteGuards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, homePathForRole } from "@/lib/auth/auth-context";
import { errorMessage } from "@/lib/api/errors";
import { validateRequired } from "@/lib/validation";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Urban Furniture Accounting" },
      {
        name: "description",
        content:
          "Sign in to the Urban Furniture Accounting System to manage invoices, bills, journal entries and payments.",
      },
      { property: "og:title", content: "Sign in — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "Access your Urban Furniture accounting workspace.",
      },
    ],
  }),
  component: () => (
    <RedirectIfAuthenticated>
      <LoginPage />
    </RedirectIfAuthenticated>
  ),
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    login_id?: string | null;
    password?: string | null;
  }>({});

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const user = await login({ login_id: loginId, password });
      await navigate({ to: homePathForRole(user.role), replace: true });
    } catch (err) {
      setError(err);
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Use your login ID and password to continue."
      footer={
        <div className="flex flex-col gap-1">
          <span>
            No account?{" "}
            <Link to="/signup" className="font-semibold text-primary hover:underline">
              Sign Up
            </Link>
          </span>
          <Link to="/forgot-password" className="font-semibold text-primary hover:underline">
            Forgot Password
          </Link>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="login_id">Login ID</Label>
          <Input
            id="login_id"
            name="login_id"
            autoComplete="username"
            required
            value={loginId}
            onChange={(e) => {
              setLoginId(e.target.value);
              setErrors((prev) => ({ ...prev, login_id: null }));
            }}
            onBlur={() =>
              setErrors((prev) => ({ ...prev, login_id: validateRequired(loginId, "Login ID") }))
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({ ...prev, password: null }));
            }}
            onBlur={() =>
              setErrors((prev) => ({ ...prev, password: validateRequired(password, "Password") }))
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
          SIGN IN
        </Button>
      </form>
    </AuthLayout>
  );
}
