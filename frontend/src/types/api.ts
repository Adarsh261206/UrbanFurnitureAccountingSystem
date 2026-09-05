/**
 * Canonical frontend types — FRONTEND_EXECUTION_PLAN_V2.md PART C.
 * snake_case field names are contractual. Do not rename.
 */

// ---------- Enums (A23) ----------
export type Role = "admin" | "accountant" | "user";
export type ProductType = "goods" | "service" | "combo";
export type AccountType =
  "asset" | "liability" | "bank" | "capital" | "cash" | "income" | "expense";
export type BudgetType = "income" | "expense";
export type BudgetStatus = "draft" | "confirmed" | "revised" | "cancelled";
export type InvoiceStatus = "draft" | "confirmed" | "paid";
export type PaymentType = "receive" | "send";
export type PaymentVia = "bank" | "cash";
export type PaymentStatus = "draft" | "confirmed" | "successful";
export type OrderStatus = "draft" | "confirmed" | "cancelled";
export type JournalEntryStatus = "draft" | "posted" | "cancelled";

// ---------- Auth ----------
export interface User {
  id: string;
  name: string | null;
  login_id: string;
  email: string;
  role: Role;
  created_at?: string;
}
/** A8 — login returns a NESTED user object. */
export interface LoginResponse {
  user: User;
}
export type SignupResponse = User;
export type MeResponse = User;
export interface MessageResponse {
  message: string;
}

// ---------- Master data ----------
export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image_url: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  created_at: string;
}
export interface Category {
  id: string;
  name: string;
}
export interface Product {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  product_type: ProductType;
  sales_price: number;
  cost: number;
  image_url?: string | null;
  created_at: string;
}
export interface Analytical {
  id: string;
  name: string;
  responsible_id: string;
  start_date: string;
  to_date: string;
  end_date: string;
  analytic_account: string;
}
export interface ChartOfAccount {
  id: string;
  name: string;
  account_type: AccountType;
  journal_type?: string | null;
}
export interface Journal {
  id: string;
  name: string;
  journal_type: string;
  default_account_id: string;
}

// ---------- Budgets (A12) ----------
export interface BudgetListRow {
  id: string;
  name: string;
  responsible: string;
  start_date: string;
  end_date: string;
  type: BudgetType;
  committed_amount: number | null;
  achieved_amount: number;
  achieved_percentage: number | null;
  amount_to_achieve: number | null;
  status: BudgetStatus;
  previous_budget_id: string | null;
  analytical_id: string;
  is_archived: boolean;
  created_at: string;
}
export interface BudgetDetail extends Omit<BudgetListRow, "responsible" | "analytical_id"> {
  responsible: { id: string; name: string } | null;
  analytical: { id: string; name: string } | null;
}

// ---------- Journal entries ----------
export interface JournalEntryRow {
  id: string;
  entry_number: string;
  journal_id: string;
  journal_name: string;
  accounting_date: string;
  reference: string | null;
  status: JournalEntryStatus;
  created_at: string;
}
export interface JournalEntryLine {
  id: string;
  account_id: string;
  partner_id: string | null;
  debit: number;
  credit: number;
}
export interface JournalEntryDetail extends JournalEntryRow {
  lines: JournalEntryLine[];
}

// ---------- Sales ----------
export interface SalesOrderRow {
  id: string;
  so_number: string;
  customer_id: string;
  customer_name: string;
  order_date: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
}
/** A7 — 08_API_CONTRACTS field names are authoritative. */
export interface OrderLineInput {
  product_id: string;
  account_id: string;
  analytical_id?: string;
  quantity: number;
  unit_price: number;
}
/** Shared line shape returned on document details (PO/SO/Invoice/Bill). */
export interface DocumentLine {
  id: string;
  sr_no: number;
  product_id: string;
  product_name?: string;
  chart_of_account_id: string;
  budget_analytic_id: string | null;
  qty: number;
  unit_price: number;
  total: number;
}
export interface SalesOrderDetail extends SalesOrderRow {
  customer: { id: string; name: string } | null;
  lines: DocumentLine[];
}
export interface PurchaseOrderDetail extends PurchaseOrderRow {
  vendor: { id: string; name: string } | null;
  lines: DocumentLine[];
}
export interface InvoiceListRow {
  id: string;
  invoice_reference: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  invoice_date: string;
  due_date: string;
  status: InvoiceStatus;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  sales_order_id: string | null;
  journal_entry_id: string | null;
  created_at: string;
}
export interface InvoiceDetail {
  id: string;
  invoice_reference: string;
  invoice_number: string;
  sales_order_id: string | null;
  customer: { id: string; name: string };
  date: string;
  invoice_date: string;
  due_date: string;
  payment_type: PaymentType;
  partner: { id: string; name: string } | null;
  payment_via: PaymentVia;
  total: number;
  amount_due: number;
  status: InvoiceStatus;
  journal_entry_id: string | null;
  lines: DocumentLine[];
  created_at: string;
}

// ---------- Purchase ----------
export interface PurchaseOrderRow {
  id: string;
  po_number: string;
  vendor_id: string;
  vendor_name: string;
  order_date: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
}
export interface BillListRow {
  id: string;
  bill_reference: string;
  vendor_id: string;
  vendor_name: string;
  bill_date: string;
  due_date: string;
  status: InvoiceStatus;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  purchase_order_id: string | null;
  journal_entry_id: string | null;
  created_at: string;
}
export interface BillDetail {
  id: string;
  bill_reference: string;
  vendor_bill_no?: string | null;
  purchase_order_id: string | null;
  vendor: { id: string; name: string };
  date: string;
  bill_date: string;
  due_date: string;
  payment_type: PaymentType;
  partner: { id: string; name: string } | null;
  payment_via: PaymentVia;
  total: number;
  amount_due: number;
  status: InvoiceStatus;
  journal_entry_id: string | null;
  lines: DocumentLine[];
  created_at: string;
}

// ---------- Payments ----------
export interface PaymentRow {
  id: string;
  payment_number: string;
  invoice_id: string | null;
  vendor_bill_id: string | null;
  amount: number;
  payment_via: PaymentVia;
  payment_date: string;
  status?: PaymentStatus;
  created_at: string;
}
/** A16 */
export interface PayRequest {
  amount: number;
  payment_via: PaymentVia;
  payment_date: string;
}

// ---------- Dashboard (A3) ----------
export interface DashboardCounts {
  draft: number;
  confirmed: number;
  total: number;
}
export interface DashboardData {
  sales: DashboardCounts;
  purchase: DashboardCounts;
  budgets: DashboardCounts;
}

// ---------- Reports (26_REPORTING_SPEC) ----------
export interface ReportItem {
  account_name: string;
  amount: number;
}
export interface ProfitAndLossReport {
  year: number;
  income: { items: ReportItem[]; total: number };
  expenses: { items: ReportItem[]; total: number };
  net_income: number;
}
export interface BalanceSheetReport {
  year: number;
  assets: { items: ReportItem[]; total: number };
  liabilities: { items: ReportItem[]; total: number };
  balance_check: boolean;
}
export interface BudgetReportRow {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  type: BudgetType;
  committed_amount: number;
  achieved_amount: number;
  achieved_percentage: number;
  amount_to_achieve: number;
  status: BudgetStatus;
}
export interface BudgetReport {
  budgets: BudgetReportRow[];
}

// ---------- Pagination (A22) ----------
export interface Paginated {
  total: number;
  page: number;
  limit: number;
}
export type ContactList = Paginated & { contacts: Contact[] };
export type ProductList = Paginated & { products: Product[] };
export type InvoiceList = Paginated & { invoices: InvoiceListRow[] };
export type BillList = Paginated & { bills: BillListRow[] };
export type SalesOrderList = Paginated & { sales_orders: SalesOrderRow[] };
export type PurchaseOrderList = Paginated & {
  purchase_orders: PurchaseOrderRow[];
};
export type PaymentList = Paginated & { payments: PaymentRow[] };
export type BudgetList = Paginated & { budgets: BudgetListRow[] };
export type UserList = Paginated & { users: User[] };
export type JournalEntryList = Paginated & {
  journal_entries: JournalEntryRow[];
};

// ---------- Error (universal) ----------
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    field: string | null;
    details?: Record<string, unknown>;
  };
}
