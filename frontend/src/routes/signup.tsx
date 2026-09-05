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
    login_id: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      // Signup does not create a session (22 §4) — send the user to /login.
      await authService.signup(form);
      toast.success("Account created. Please sign in.");
      await navigate({ to: "/login", replace: true });
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
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="login_id">Login ID</Label>
          <Input
            id="login_id"
            autoComplete="username"
            required
            value={form.login_id}
            onChange={(e) => set("login_id", e.target.value)}
          />
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
          />
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
          />
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
          />
        </div>
        {error ? (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage(error)}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
