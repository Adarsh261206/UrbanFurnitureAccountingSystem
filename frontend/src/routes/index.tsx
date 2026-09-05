import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/auth-context";
import { LoadingState } from "@/components/common/States";

/** "/" is an entry point only: it sends the visitor to their role home or /login. */
export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { status, homePath } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "authenticated") void navigate({ to: homePath, replace: true });
    if (status === "unauthenticated") void navigate({ to: "/login", replace: true });
  }, [status, homePath, navigate]);

  return <LoadingState label="Loading your workspace" />;
}
