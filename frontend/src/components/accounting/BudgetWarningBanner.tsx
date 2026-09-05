import { TriangleAlert } from "lucide-react";
import type { BudgetWarning } from "@/components/accounting/useBudgetWarnings";

/** Non-blocking budget exceed warning — never prevents confirmation. */
export function BudgetWarningBanner({ warnings }: { warnings: BudgetWarning[] }) {
  if (warnings.length === 0) return null;
  return (
    <div className="rounded-md border border-warning/30 bg-warning/[0.06] p-4" role="status">
      <div className="flex items-start gap-2.5">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
        <div className="text-[13px]">
          <p className="font-semibold text-warning">Exceeds approved budget</p>
          <ul className="mt-1 space-y-0.5 text-foreground/80">
            {warnings.map((w) => (
              <li key={w.analyticalId}>
                The entered amount is higher than the remaining budget amount for{" "}
                <span className="font-medium text-foreground">{w.analyticalName}</span>. Consider
                adjusting the value or revise the budget.
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs text-muted-foreground">
            This warning does not prevent confirmation.
          </p>
        </div>
      </div>
    </div>
  );
}
