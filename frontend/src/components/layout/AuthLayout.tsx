import type { ReactNode } from "react";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <span className="text-sm font-semibold tracking-tight">Urban Furniture</span>
        <div>
          <h2 className="text-3xl font-semibold leading-tight">
            Accounting built around your sales and purchase workflow.
          </h2>
          <p className="mt-4 max-w-md text-sm text-sidebar-foreground/70">
            Orders, invoices, bills, journal entries and payments — recorded once and
            reconciled against your ledger.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/50">
          Urban Furniture Accounting System
        </p>
      </div>
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle ? (
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-6 text-sm text-muted-foreground">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
