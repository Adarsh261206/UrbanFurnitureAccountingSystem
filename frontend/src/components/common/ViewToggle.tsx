import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "list" | "kanban";

/** List ↔ Kanban toggle — icon-only segmented control. */
export function ViewToggle({
  value,
  onChange,
  label = "View mode",
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
  label?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex overflow-hidden rounded-md border border-input bg-card shadow-sm"
    >
      {[
        { mode: "list" as const, icon: List, text: "List" },
        { mode: "kanban" as const, icon: LayoutGrid, text: "Kanban" },
      ].map(({ mode, icon: Icon, text }) => (
        <button
          key={mode}
          type="button"
          aria-pressed={value === mode}
          title={text}
          onClick={() => onChange(mode)}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            value === mode
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Icon className="size-4" aria-hidden />
          <span className="hidden sm:inline">{text}</span>
        </button>
      ))}
    </div>
  );
}

/** Responsive card grid used for every Kanban view. */
export function KanbanGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>;
}

export function KanbanCard({
  onClick,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex h-full flex-col gap-3 rounded-lg border bg-card p-4 text-left shadow-sm transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-ring/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </button>
  );
}

/** Status sections (All / Confirmed / Draft) as filter tabs. */
export function SectionTabs({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex flex-wrap gap-1 rounded-md border border-input bg-card p-0.5 shadow-sm"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-[5px] px-3 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            value === o.value
              ? "bg-secondary font-semibold text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
