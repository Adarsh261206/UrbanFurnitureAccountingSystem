import { useEffect, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/common/States";
import type { Role } from "@/types/api";

/**
 * Route guards are UX protection only — the backend remains the security
 * boundary (V2 PART D, guard rules 1-5).
 */

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "unauthenticated") {
      void navigate({ to: "/login", replace: true });
    }
  }, [status, navigate]);

  if (status !== "authenticated") return <LoadingState label="Restoring your session" />;
  return <>{children}</>;
}

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { status, user, homePath } = useAuth();
  const navigate = useNavigate();
  const allowed = user ? roles.includes(user.role) : false;

  // Guard rule 4: the `user` role never lands on admin/accountant screens.
  useEffect(() => {
    if (status === "authenticated" && user && !allowed && user.role === "user") {
      void navigate({ to: homePath, replace: true });
    }
  }, [status, user, allowed, homePath, navigate]);

  if (status !== "authenticated") return <LoadingState label="Restoring your session" />;
  if (allowed) return <>{children}</>;
  return <AccessDenied />;
}

/** 403 presentation — no redirect (24 §17). */
export function AccessDenied() {
  const { homePath } = useAuth();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="size-7" aria-hidden />
      </span>
      <div>
        <h1 className="text-xl font-semibold text-foreground">Access denied</h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          You do not have permission to perform this action
        </p>
      </div>
      <Button asChild variant="outline">
        <Link to={homePath}>Back to your workspace</Link>
      </Button>
    </div>
  );
}

/** Public auth screens: bounce an already-signed-in visitor to their home. */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { status, homePath } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "authenticated") {
      void navigate({ to: homePath, replace: true });
    }
  }, [status, homePath, navigate]);

  if (status === "loading") return <LoadingState label="Checking your session" />;
  return <>{children}</>;
}
