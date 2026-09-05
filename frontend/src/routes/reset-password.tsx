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

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting || !token) return;
    if (password !== confirmPassword) {
      setError({ message: "Passwords do not match" });
      return;
    }
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
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm_password">Confirm new password</Label>
            <Input
              id="confirm_password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
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
