import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { RedirectIfAuthenticated } from "@/components/guards/RouteGuards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/authService";
import { errorMessage } from "@/lib/api/errors";
import { validateConfirmPassword, validatePassword } from "@/lib/validation";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({
    meta: [
      { title: "Set new password — Urban Furniture Accounting" },
      {
        name: "description",
        content: "Choose a new password for your Urban Furniture Accounting System account.",
      },
      { property: "og:title", content: "Set new password — Urban Furniture Accounting" },
      {
        property: "og:description",
        content: "Choose a new password for your accounting account.",
      },
    ],
  }),
  component: () => (
    <RedirectIfAuthenticated>
      <ResetPasswordPage />
    </RedirectIfAuthenticated>
  ),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useSearch({ from: "/reset-password" });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    password: string | null;
    confirm_password: string | null;
  }>({ password: null, confirm_password: null });

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting || !token) return;
    const nextErrors = {
      password: validatePassword(password),
      confirm_password: validateConfirmPassword(password, confirmPassword),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await authService.resetPassword(token, password, confirmPassword);
      toast.success(res.message);
      await navigate({ to: "/login", replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Choose a new password for your account."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      {!token ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          This reset link is missing a token. Please use the link from your email.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: null }));
              }}
              onBlur={() =>
                setErrors((prev) => ({ ...prev, password: validatePassword(password) }))
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
            <Label htmlFor="confirm_password">Confirm new password</Label>
            <Input
              id="confirm_password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((prev) => ({ ...prev, confirm_password: null }));
              }}
              onBlur={() =>
                setErrors((prev) => ({
                  ...prev,
                  confirm_password: validateConfirmPassword(password, confirmPassword),
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
            Reset password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
