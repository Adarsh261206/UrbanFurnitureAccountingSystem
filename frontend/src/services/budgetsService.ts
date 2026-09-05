import { http } from "@/lib/api/client";
import type { BudgetDetail, BudgetList, BudgetType } from "@/types/api";

/** PART B5 — Budgets. A11: responsible_id (not `responsible`). */
export interface BudgetInput {
  name: string;
  responsible_id: string;
  start_date: string;
  end_date: string;
  type: BudgetType;
  analytical_id: string;
}

export const budgetsService = {
  list: (params: { page?: number; limit?: number; type?: string; status?: string } = {}) =>
    http.get<BudgetList>("/budgets", { params }),
  get: (id: string) => http.get<BudgetDetail>(`/budgets/${id}`),
  create: (body: BudgetInput) => http.post<BudgetDetail>("/budgets", body),
  /** Draft only. */
  update: (id: string, body: Partial<BudgetInput>) =>
    http.put<BudgetDetail>(`/budgets/${id}`, body),
  confirm: (id: string, body: { committed_amount: number }) =>
    http.put<BudgetDetail>(`/budgets/${id}/confirm`, body),
  /** Creates a new draft — NOT idempotent (17 §9): disable while submitting. */
  revise: (id: string) => http.post<BudgetDetail>(`/budgets/${id}/revise`),
  cancel: (id: string) => http.put<BudgetDetail>(`/budgets/${id}/cancel`),
};
