import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Building2,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  ShoppingCart,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import type { Role } from "@/types/api";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  to: string;
  search?: Record<string, string>;
  icon: typeof BookOpen;
  roles: readonly Role[];
};

/**
 * Four source-required top-level tabs — Account | Sales | Purchase | Report —
 * each opening its documented sub-menu. Items are filtered by role
 * (18_RBAC_MATRIX); unauthorized entries are never rendered.
 */
const TABS: { group: string; items: NavItem[] }[] = [
  {
    group: "Account",
    items: [
      { label: "Contact", to: "/contacts", icon: Building2, roles: ["admin", "accountant"] },
      { label: "Product", to: "/products", icon: Package, roles: ["admin", "accountant"] },
      { label: "Analyticals", to: "/analyticals", icon: BookOpen, roles: ["admin", "accountant"] },
      { label: "Analytical Budget", to: "/budgets", icon: Wallet, roles: ["admin", "accountant"] },
      { label: "Chart of Account", to: "/chart-of-accounts", icon: BookOpen, roles: ["admin", "accountant"] },
      { label: "Journals", to: "/journals", icon: BookOpen, roles: ["admin", "accountant"] },
      { label: "Journal Entries", to: "/journal-entries", icon: FileText, roles: ["admin", "accountant"] },
    ],
  },
  {
    group: "Sales",
    items: [
      { label: "Sales Order", to: "/sales-orders", icon: ShoppingCart, roles: ["admin", "accountant"] },
      { label: "Sale Invoice", to: "/invoices", icon: Receipt, roles: ["admin", "accountant", "user"] },
      {
        label: "Receipt",
        to: "/payments",
        search: { tab: "receipts" },
        icon: Wallet,
        roles: ["admin", "accountant", "user"],
      },
    ],
  },
  {
    group: "Purchase",
    items: [
      { label: "Purchase Order", to: "/purchase-orders", icon: ShoppingCart, roles: ["admin", "accountant"] },
      { label: "Purchase Bill", to: "/bills", icon: FileText, roles: ["admin", "accountant"] },
      {
        label: "Payment",
        to: "/payments",
        search: { tab: "payments" },
        icon: Wallet,
        roles: ["admin", "accountant"],
      },
    ],
  },
  {
    group: "Report",
    items: [
      { label: "Balancesheet", to: "/reports/balance-sheet", icon: FileText, roles: ["admin", "accountant"] },
      { label: "Profit and Loss", to: "/reports/profit-and-loss", icon: FileText, roles: ["admin", "accountant"] },
      { label: "Budget Report", to: "/reports/budget-report", icon: FileText, roles: ["admin", "accountant"] },
    ],
  },
  {
    group: "Administration",
    items: [{ label: "Users", to: "/users", icon: Users, roles: ["admin"] }],
  },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const role = user?.role;

  const groups = TABS.map((g) => ({
    ...g,
    items: g.items.filter((i) => (role ? i.roles.includes(role) : false)),
  })).filter((g) => g.items.length > 0);

  const activeGroup =
    groups.find((g) => g.items.some((i) => pathname === i.to || pathname.startsWith(`${i.to}/`)))
      ?.group ?? groups[0]?.group;

  const [expanded, setExpanded] = useState<string | null>(null);
  const openGroup = expanded ?? activeGroup ?? null;

  const dashboardVisible = role === "admin" || role === "accountant";

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-sidebar-border px-5">
          <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
            Urban Furniture
            <span className="block text-xs font-normal text-sidebar-foreground/60">
              Accounting System
            </span>
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {dashboardVisible ? (
            <Link
              to="/dashboard"
              onClick={() => setOpen(false)}
              className={cn(
                "mb-3 flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                pathname === "/dashboard"
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <LayoutDashboard className="size-4 shrink-0" aria-hidden />
              Dashboard
            </Link>
          ) : null}

          {groups.map((group) => {
            const isOpen = openGroup === group.group;
            return (
              <div key={group.group} className="mb-1.5">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setExpanded(isOpen ? "" : group.group)}
                  className="flex w-full items-center justify-between rounded-md px-2 py-2 text-[13px] font-semibold uppercase tracking-wider text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {group.group}
                  <ChevronDown
                    className={cn("size-4 transition-transform", isOpen ? "rotate-180" : "")}
                    aria-hidden
                  />
                </button>
                {isOpen ? (
                  <ul className="mt-0.5 space-y-0.5 pl-1">
                    {group.items.map((item) => {
                      const active =
                        pathname === item.to || pathname.startsWith(`${item.to}/`);
                      const Icon = item.icon;
                      return (
                        <li key={item.label}>
                          <Link
                            to={item.to}
                            search={item.search as never}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                              active
                                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                            )}
                          >
                            <Icon className="size-4 shrink-0" aria-hidden />
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </nav>
      </aside>

      {open ? (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium leading-tight text-foreground">
                {user?.login_id}
              </p>
              <p className="text-xs capitalize text-muted-foreground">{user?.role}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void logout()}>
              <LogOut className="size-4" aria-hidden />
              Sign out
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
