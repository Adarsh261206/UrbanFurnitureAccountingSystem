import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  Search,
  Settings,
  ShoppingCart,
  Tag,
  Users,
  Mail,
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
  state?: Record<string, unknown>;
  icon: typeof BookOpen;
  roles: readonly Role[];
};

/**
 * ERP module structure — Purchase | Sales | Accounting | Reports — each
 * opening its sub-menu in the sidebar. Filtered by role (18_RBAC_MATRIX).
 */
const TABS: { group: string; items: NavItem[] }[] = [
  {
    group: "Purchase",
    items: [
      {
        label: "Purchase Orders",
        to: "/purchase-orders",
        icon: ShoppingCart,
        roles: ["admin", "accountant"],
      },
      { label: "Vendor Bills", to: "/bills", icon: FileText, roles: ["admin", "accountant"] },
      {
        label: "Vendor Payments",
        to: "/payments",
        state: { tab: "payments" },
        icon: Wallet,
        roles: ["admin", "accountant"],
      },
    ],
  },
  {
    group: "Sales",
    items: [
      {
        label: "Sales Orders",
        to: "/sales-orders",
        icon: ShoppingCart,
        roles: ["admin", "accountant"],
      },
      {
        label: "Customer Invoices",
        to: "/invoices",
        icon: Receipt,
        roles: ["admin", "accountant", "user"],
      },
      {
        label: "Credit Notes",
        to: "/credit-notes",
        icon: FileText,
        roles: ["admin", "accountant"],
      },
      {
        label: "Customer Payments",
        to: "/payments",
        state: { tab: "receipts" },
        icon: Wallet,
        roles: ["admin", "accountant", "user"],
      },
    ],
  },
  {
    group: "Accounting",
    items: [
      {
        label: "Journal Entries",
        to: "/journal-entries",
        icon: FileText,
        roles: ["admin", "accountant"],
      },
      {
        label: "Chart of Accounts",
        to: "/chart-of-accounts",
        icon: BookOpen,
        roles: ["admin", "accountant"],
      },
      { label: "Budgets", to: "/budgets", icon: Wallet, roles: ["admin", "accountant"] },
      { label: "Analyticals", to: "/analyticals", icon: BookOpen, roles: ["admin", "accountant"] },
      { label: "Journals", to: "/journals", icon: BookOpen, roles: ["admin", "accountant"] },
    ],
  },
  {
    group: "Reports",
    items: [
      {
        label: "Profit and Loss",
        to: "/reports/profit-and-loss",
        icon: FileText,
        roles: ["admin", "accountant"],
      },
      {
        label: "Balance Sheet",
        to: "/reports/balance-sheet",
        icon: BarChart3,
        roles: ["admin", "accountant"],
      },
      {
        label: "Trial Balance",
        to: "/reports/trial-balance",
        icon: BarChart3,
        roles: ["admin", "accountant"],
      },
      {
        label: "Budget Report",
        to: "/reports/budget-report",
        icon: FileText,
        roles: ["admin", "accountant"],
      },
      {
        label: "Budget Report",
        to: "/reports/budget-report",
        icon: FileText,
        roles: ["admin", "accountant"],
      },
      {
        label: "AR Aging",
        to: "/reports/aging-receivables",
        icon: BarChart3,
        roles: ["admin", "accountant"],
      },
      {
        label: "AP Aging",
        to: "/reports/aging-payables",
        icon: BarChart3,
        roles: ["admin", "accountant"],
      },
      {
        label: "GSTR-1",
        to: "/reports/gstr-1",
        icon: FileText,
        roles: ["admin", "accountant"],
      },
      {
        label: "GSTR-3B",
        to: "/reports/gstr-3b",
        icon: FileText,
        roles: ["admin", "accountant"],
      },
    ],
  },
  {
    group: "Master Data",
    items: [
      { label: "Contacts", to: "/contacts", icon: Building2, roles: ["admin", "accountant"] },
      { label: "Products", to: "/products", icon: Package, roles: ["admin", "accountant"] },
      { label: "Brands", to: "/brands", icon: Tag, roles: ["admin", "accountant"] },
      { label: "Categories", to: "/categories", icon: Package, roles: ["admin", "accountant"] },
      { label: "Stock Levels", to: "/inventory", icon: Package, roles: ["admin", "accountant"] },
      {
        label: "Stock Moves",
        to: "/inventory/moves",
        icon: Package,
        roles: ["admin", "accountant"],
      },
    ],
  },
  {
    group: "Administration",
    items: [
      { label: "Users", to: "/users", icon: Users, roles: ["admin"] },
      { label: "Audit Log", to: "/admin/audit-log", icon: FileText, roles: ["admin"] },
      { label: "SMTP Settings", to: "/settings/smtp", icon: Mail, roles: ["admin"] },
    ],
  },
];

const GROUP_ICONS: Record<string, typeof Settings> = {
  Purchase: ShoppingCart,
  Sales: Receipt,
  Accounting: BookOpen,
  Reports: BarChart3,
  "Master Data": Package,
  Administration: Settings,
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const role = user?.role;

  const groups = TABS.map((g) => ({
    ...g,
    items: g.items.filter((i) => (role ? i.roles.includes(role) : false)),
  })).filter((g) => g.items.length > 0);

  const activeGroup =
    groups.find((g) => g.items.some((i) => pathname === i.to || pathname.startsWith(`${i.to}/`)))
      ?.group ?? null;

  const [expanded, setExpanded] = useState<string | null>(null);
  const openGroup = expanded ?? activeGroup ?? groups[0]?.group ?? null;

  const dashboardVisible = role === "admin" || role === "accountant";

  const allItems = groups.flatMap((g) => g.items);
  const searchItems = dashboardVisible
    ? [{ label: "Dashboard", to: "/dashboard" as const }, ...allItems]
    : allItems;

  const sidebar = (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      {dashboardVisible ? (
        <Link
          to="/dashboard"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "mb-1 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
            pathname === "/dashboard"
              ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
              : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
          )}
        >
          <LayoutDashboard className="size-4 shrink-0" aria-hidden />
          Dashboard
        </Link>
      ) : null}

      {groups.map((group) => {
        const isOpen = openGroup === group.group;
        const Icon = GROUP_ICONS[group.group] ?? Settings;
        return (
          <div key={group.group} className="mb-0.5">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setExpanded(isOpen ? null : group.group)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-2.5 py-2 text-[13px] font-semibold transition-colors",
                activeGroup === group.group
                  ? "text-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
              )}
            >
              <span className="flex items-center gap-2.5">
                <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                {group.group}
              </span>
              <ChevronRight
                className={cn(
                  "size-3.5 text-muted-foreground transition-transform",
                  isOpen && "rotate-90",
                )}
                aria-hidden
              />
            </button>
            {isOpen ? (
              <ul className="mt-0.5 space-y-px border-l border-sidebar-border pl-3.5 ml-3">
                {group.items.map((item) => {
                  const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
                  const Icon = item.icon;
                  return (
                    <li key={item.label}>
                      <Link
                        to={item.to}
                        state={item.state as never}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                          active
                            ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                        )}
                      >
                        <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
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
  );

  const sidebarFooter = (
    <div className="border-t border-sidebar-border p-3">
      <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
          {user?.login_id ? initials(user.login_id) : "U"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-foreground">
            {user?.login_id}
          </span>
          <span className="block text-[11px] capitalize text-muted-foreground">{user?.role}</span>
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          aria-label="Sign out"
          onClick={() => void logout()}
        >
          <LogOut className="size-3.5" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Top header */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center border-b border-white/10 bg-navbar px-4 text-navbar-foreground sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-navbar-foreground/90 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Open navigation"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="size-4" />
        </Button>
        <Link to="/dashboard" className="mr-4 flex shrink-0 items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-md bg-white text-[11px] font-bold text-[#714b67]">
            UF
          </span>
          <span className="hidden text-[15px] font-bold tracking-tight text-white sm:block">
            Urban Furniture
            <span className="ml-2 hidden text-[11px] font-medium uppercase tracking-[0.08em] text-navbar-muted md:inline">
              Accounting
            </span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {/* Quick module search */}
          <GlobalSearch items={searchItems} onNavigate={() => setMobileOpen(false)} />
          {/* Notifications */}
          <NotificationsBell />
          <div className="hidden items-center gap-2.5 rounded-md border border-white/25 bg-white/10 py-1 pl-1.5 pr-3 backdrop-blur-sm sm:flex">
            <span className="flex size-6 items-center justify-center rounded-full bg-white/25 text-[10px] font-bold text-white">
              {user?.login_id ? initials(user.login_id) : "U"}
            </span>
            <span className="text-[13px] font-medium text-white">{user?.login_id}</span>
            <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              {user?.role}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-navbar-muted hover:bg-white/10 hover:text-white"
            onClick={() => void logout()}
          >
            <LogOut className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar pt-14 lg:flex"
        aria-label="Main navigation"
      >
        {sidebar}
        {sidebarFooter}
      </aside>

      {/* Mobile sidebar */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", mobileOpen ? "" : "pointer-events-none")}>
        <div
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
          aria-label="Main navigation"
        >
          <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
            <span className="text-sm font-bold">Urban Furniture</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
          {sidebar}
          {sidebarFooter}
        </aside>
      </div>

      <div className="pt-14 lg:pl-60">
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function GlobalSearch({
  items,
  onNavigate,
}: {
  items: { label: string; to: string }[];
  onNavigate: () => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const matches = query.trim()
    ? items.filter((i) => i.label.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
    : [];

  function go(to: string) {
    setQuery("");
    setOpen(false);
    onNavigate();
    void navigate({ to: to as never });
  }

  return (
    <div className="relative hidden md:block">
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-navbar-muted"
        aria-hidden
      />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && matches[0]) go(matches[0].to);
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Search modules…"
        aria-label="Search modules"
        className="h-8 w-44 rounded-md border border-white/25 bg-white/10 pl-8 pr-3 text-[13px] text-white placeholder:text-navbar-muted shadow-sm backdrop-blur-sm transition-[width] focus:w-64 focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
      />
      {open && matches.length > 0 ? (
        <ul className="absolute right-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-lg border bg-popover py-1 shadow-md">
          {matches.map((m) => (
            <li key={m.to + m.label}>
              <button
                type="button"
                onMouseDown={() => go(m.to)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden />
                {m.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function NotificationsBell() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-navbar-muted hover:bg-white/10 hover:text-white"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="size-4" />
      </Button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-72 overflow-hidden rounded-lg border bg-popover shadow-md">
          <p className="border-b px-4 py-2.5 text-[13px] font-semibold text-popover-foreground">
            Notifications
          </p>
          <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">
            You're all caught up.
          </p>
        </div>
      ) : null}
    </div>
  );
}
