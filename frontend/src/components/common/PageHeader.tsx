import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type Crumb = { label: string; to?: string };

/**
 * Page header: back button, breadcrumb trail, strong title, contextual
 * subtitle, and primary actions. Typography-driven — no card chrome.
 */
export function PageHeader({
  title,
  crumbs = [],
  description,
  actions,
  backTo,
  className,
}: {
  title: string;
  crumbs?: Crumb[];
  description?: string;
  actions?: ReactNode;
  backTo?: string;
  className?: string;
}) {
  const navigate = useNavigate();
  const trail = crumbs.length > 0 ? crumbs : [{ label: title }];

  return (
    <div className={cn("mb-6", className)}>
      <nav aria-label="Breadcrumb" className="mb-1.5 flex items-center gap-1 text-xs">
        {backTo ? (
          <Button
            variant="ghost"
            size="sm"
            className="mr-1 h-6 px-1.5 text-xs text-muted-foreground hover:text-primary"
            onClick={() => navigate({ to: backTo })}
          >
            <ArrowLeft className="size-3.5" />
          </Button>
        ) : null}
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
