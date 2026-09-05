import type { ReactNode } from "react";

/**
 * Premium auth shell: centered white card on a soft gray backdrop with the
 * brand mark on top.
 */
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 flex flex-col items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-[13px] font-bold text-primary-foreground shadow-sm">
            UF
          </span>
          <div className="text-center">
            <h1 className="text-lg font-bold tracking-tight text-foreground">Urban Furniture</h1>
            <p className="text-xs text-muted-foreground">Accounting System</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          {subtitle ? <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
          {footer ? <div className="mt-6 text-[13px] text-muted-foreground">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
