import { http } from "@/lib/api/client";
import type {
  BalanceSheetReport,
  BudgetReport,
  BudgetType,
  DashboardData,
  DashboardSummary,
  PaymentList,
  ProfitAndLossReport,
} from "@/types/api";

/** PART B8 — Payments (list only). */
export const paymentsService = {
  list: (
    params: {
      page?: number;
      limit?: number;
      invoice_id?: string;
      vendor_bill_id?: string;
    } = {},
  ) => http.get<PaymentList>("/payments", { params }),
};

/** PART B9 — Dashboard (A3): server-side counts, never client aggregation. */
export const dashboardService = {
  get: () => http.get<DashboardData>("/dashboard"),
  /** Chart data: revenue/expense trends, cash flow, invoice status, top customers. */
  summary: () => http.get<DashboardSummary>("/dashboard/summary"),
};

/** PART B9 — Reports (26_REPORTING_SPEC). All values come from the backend. */
export const reportsService = {
  profitAndLoss: (params: { year?: number } = {}) =>
    http.get<ProfitAndLossReport>("/reports/profit-and-loss", { params }),
  balanceSheet: (params: { year?: number } = {}) =>
    http.get<BalanceSheetReport>("/reports/balance-sheet", { params }),
  /** 23_MATRIX §15/§16 Print: GET ?year=&format=pdf → PDF download. */
  profitAndLossPdf: (params: { year: number }) =>
    http.getBlob("/reports/profit-and-loss", { params: { ...params, format: "pdf" } }),
  balanceSheetPdf: (params: { year: number }) =>
    http.getBlob("/reports/balance-sheet", { params: { ...params, format: "pdf" } }),
  budgetReport: (params: { year?: number; type?: BudgetType } = {}) =>
    http.get<BudgetReport>("/reports/budget-report", { params }),
};

/** PART B9 — Upload. */
export const uploadService = {
  upload: async (file: File): Promise<{ url: string }> => {
    const form = new FormData();
    form.append("file", file);
    return http.post<{ url: string }>("/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
