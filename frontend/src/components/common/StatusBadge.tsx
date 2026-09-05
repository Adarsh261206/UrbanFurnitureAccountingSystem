import { cn } from "@/lib/utils";

/**
 * One consistent status system — subtle tinted badges with semantic meaning.
 * Unknown values render neutrally, never guessed.
 */
const TONES: Record<string, string> = {
  draft: "bg-secondary text-secondary-foreground",
  confirmed: "bg-info/10 text-info",
  posted: "bg-info/10 text-info",
  paid: "bg-success/10 text-success",
  partially_paid: "bg-warning/10 text-warning",
  cancelled: "bg-destructive/10 text-destructive",
  active: "bg-success/10 text-success",
  inactive: "bg-secondary text-secondary-foreground",
  revised: "bg-info/10 text-info",
  successful: "bg-success/10 text-success",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = TONES[status] ?? "bg-secondary text-secondary-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize",
        tone,
        className,
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
