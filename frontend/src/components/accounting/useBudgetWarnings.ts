import { useMemo } from "react";
import type { DocumentLine, BudgetListRow } from "@/types/api";

export interface BudgetWarning {
  analyticalId: string;
  analyticalName: string;
  lineTotal: number;
  remaining: number;
}

/**
 * Non-blocking budget check (frontend-only, client-side computation).
 *
 * For every order/invoice line carrying a budget analytic, compare the line
 * total against the remaining committed amount of the matching confirmed
 * budget. Returns warnings; callers decide how to present them. This never
 * blocks confirmation.
 */
export function useBudgetWarnings(
  lines: DocumentLine[],
  budgets: BudgetListRow[],
): BudgetWarning[] {
  return useMemo(() => {
    if (lines.length === 0 || budgets.length === 0) return [];

    const analyticalNames = new Map<string, string>();
    for (const b of budgets) {
      if (!analyticalNames.has(b.analytical_id)) {
        analyticalNames.set(b.analytical_id, b.name);
      }
    }

    const grouped = new Map<string, number>();
    for (const line of lines) {
      if (!line.budget_analytic_id) continue;
      grouped.set(
        line.budget_analytic_id,
        (grouped.get(line.budget_analytic_id) ?? 0) + line.total,
      );
    }

    const warnings: BudgetWarning[] = [];
    for (const [analyticalId, lineTotal] of grouped) {
      const budget = budgets.find(
        (b) => b.analytical_id === analyticalId && b.status === "confirmed",
      );
      if (!budget) continue;
      const committed = budget.committed_amount ?? 0;
      const achieved = budget.achieved_amount ?? 0;
      const remaining = committed - achieved;
      if (remaining < lineTotal) {
        warnings.push({
          analyticalId,
          analyticalName: analyticalNames.get(analyticalId) ?? analyticalId,
          lineTotal,
          remaining,
        });
      }
    }
    return warnings;
  }, [lines, budgets]);
}
