import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; to?: string };

/**
 * Page header: strong title, contextual subtitle, breadcrumb trail and
 * primary actions. Typography-driven — no card chrome around it.
 */
export function PageHeader({
  title,
  crumbs = [],
  description,
  actions,
  className,
}: {
  title: string;
  crumbs?: Crumb[];
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  const trail = crumbs.length > 0 ? crumbs : [{ label: title }];
  return (
    <div className={cn("mb-6", className)}>
      <nav aria-label="Breadcrumb" className="mb-1.5 flex items-center gap-1 text-xs">
        <Link
          to="/dashboard"
          className="font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          Dashboard
        </Link>
        {trail.map((c) => (
          <span key={c.label} className="flex items-center gap-1">
            <ChevronRight className="size-3 text-muted-foreground/60" aria-hidden />
            {c.to ? (
              <Link
                to={c.to}
                className="font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {c.label}
              </Link>
            ) : (
              <span className="truncate font-semibold text-foreground">{c.label}</span>
            )}
          </span>
        ))}
      </nav>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>
          {description ? (
            <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
