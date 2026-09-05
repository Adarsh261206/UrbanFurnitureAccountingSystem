import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RequireAuth } from "@/components/guards/RouteGuards";
import { AppLayout } from "@/components/layout/AppLayout";

/**
 * Pathless layout for every authenticated screen. Auth is checked once here,
 * never repeated inside pages; per-route role rules use <RequireRole>.
 */
export const Route = createFileRoute("/_app")({
  component: AppLayoutRoute,
});

function AppLayoutRoute() {
  return (
    <RequireAuth>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </RequireAuth>
  );
}
