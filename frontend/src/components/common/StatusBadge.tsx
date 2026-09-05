import { cn } from "@/lib/utils";

/**
 * Status presentation only — the backend is authoritative for every status
 * value (17_STATE_MACHINES). Unknown values render neutrally, never guessed.
 */
const TONES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  posted: "bg-primary/10 text-primary border-primary/20",
  paid: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400",
  partially_paid: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  active: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400",
  inactive: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = TONES[status] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        tone,
        className,
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
