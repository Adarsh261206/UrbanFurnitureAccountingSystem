/**
 * Canonical frontend types — FRONTEND_EXECUTION_PLAN_V2.md PART C.
 * snake_case field names are contractual. Do not rename.
 */

// ---------- Enums (A23) ----------
export type Role = "admin" | "accountant" | "user";
export type ProductType = "goods" | "service" | "combo";
export type ContactType = "customer" | "vendor" | "both";
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
export type CreditNoteStatus = "draft" | "confirmed" | "cancelled";
export type CreditNoteType = "credit_note" | "debit_note";
export type JournalType = "sale" | "purchase" | "bank" | "cash";
export type ApprovalStatus = "pending" | "approved" | "rejected";

// ---------- Auth ----------
export interface User {
  id: string;
  name: string | null;
  login_id: string;
  email: string;
  role: Role;
  is_active?: boolean;
  approval_status?: ApprovalStatus;
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
  contact_type: ContactType;
  gstin?: string | null;
  pan?: string | null;
  created_at: string;
}
export interface Category {
  id: string;
  name: string;
}
export interface Brand {
  id: string;
  name: string;
  product_count?: number;
  created_at?: string;
}
export interface ProductImage {
  id: string;
  image_url: string;
  sort_order: number;
}
export interface Product {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  brand_id: string | null;
  brand_name: string | null;
  product_type: ProductType;
  sku: string | null;
  barcode: string | null;
  hsn_code: string | null;
  description: string | null;
  is_active: boolean;
  sales_price: number;
  cost: number;
  image_url?: string | null;
  images?: ProductImage[];
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
  tax_rate?: number;
  tax_amount?: number;
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
  customer: { id: string; name: string; gstin?: string | null } | null;
  date: string;
  invoice_date: string;
  due_date: string;
  payment_type: PaymentType;
  partner: { id: string; name: string } | null;
  payment_via: PaymentVia;
  subtotal: number;
  tax_amount: number;
  total: number;
  amount_due: number;
  notes: string | null;
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
  vendor: { id: string; name: string; gstin?: string | null } | null;
  date: string;
  bill_date: string;
  due_date: string;
  payment_type: PaymentType;
  partner: { id: string; name: string } | null;
  payment_via: PaymentVia;
  subtotal: number;
  tax_amount: number;
  total: number;
  amount_due: number;
  notes: string | null;
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
export interface DashboardSummary {
  kpis: {
    revenue: number;
    revenue_change_pct: number | null;
    expense: number;
    expense_change_pct: number | null;
    profit: number;
    profit_change_pct: number | null;
    receivable: number;
    payable: number;
    revenue_ytd: number;
    expense_ytd: number;
  };
  monthly_revenue_expense: { month: string; revenue: number; expense: number }[];
  cash_flow: { month: string; inflow: number; outflow: number }[];
  invoice_status: { status: string; count: number }[];
  top_customers: { name: string; outstanding: number }[];
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
export interface TrialBalanceReport {
  year: number;
  accounts: {
    account_id: string;
    account_name: string;
    account_type: string;
    debit: number;
    credit: number;
  }[];
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
}
export interface CashFlowReportItem {
  description: string;
  amount: number;
}
export interface CashFlowReport {
  year: number;
  operating: { items: CashFlowReportItem[]; total: number };
  investing: { items: CashFlowReportItem[]; total: number };
  financing: { items: CashFlowReportItem[]; total: number };
  net_change: number;
  opening_balance: number;
  closing_balance: number;
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

// ---------- Credit Notes ----------
export interface CreditNoteListRow {
  id: string;
  number: string;
  type: string;
  contact_id: string;
  contact_name: string;
  date: string;
  due_date: string | null;
  status: CreditNoteStatus;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  amount_due: number;
  notes: string | null;
  reason: string | null;
  created_at: string;
}
export interface CreditNoteDetail {
  id: string;
  number: string;
  type: string;
  contact: { id: string; name: string; gstin?: string | null } | null;
  invoice_id: string | null;
  invoice_number: string | null;
  bill_id: string | null;
  bill_reference: string | null;
  date: string;
  due_date: string | null;
  status: CreditNoteStatus;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  amount_due: number;
  notes: string | null;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

// ---------- Aging Reports ----------
export interface AgingInvoiceItem {
  invoice_id: string;
  invoice_number: string;
  total: number;
  amount_due: number;
  due_date: string;
  days_overdue: number;
  bucket: "current" | "1_30" | "31_60" | "61_90" | "90_plus";
}
export interface AgingCustomerRow {
  contact_id: string;
  contact_name: string;
  invoices: AgingInvoiceItem[];
  total_due: number;
}
export interface AgingReceivablesReport {
  as_of_date: string;
  customers: AgingCustomerRow[];
  bucket_totals: {
    current: number;
    "1_30": number;
    "31_60": number;
    "61_90": number;
    "90_plus": number;
  };
  grand_total: number;
}
export interface AgingBillItem {
  bill_id: string;
  bill_reference: string;
  total: number;
  amount_due: number;
  due_date: string;
  days_overdue: number;
  bucket: "current" | "1_30" | "31_60" | "61_90" | "90_plus";
}
export interface AgingVendorRow {
  contact_id: string;
  contact_name: string;
  bills: AgingBillItem[];
  total_due: number;
}
export interface AgingPayablesReport {
  as_of_date: string;
  vendors: AgingVendorRow[];
  bucket_totals: {
    current: number;
    "1_30": number;
    "31_60": number;
    "61_90": number;
    "90_plus": number;
  };
  grand_total: number;
}

// ---------- GST Reports ----------
export interface Gstr1HsnItem {
  hsn_code: string;
  description: string;
  uqc: string;
  total_quantity: number;
  total_value: number;
  taxable_value: number;
  igst: number;
  cgst: number;
  sgst: number;
}

export interface Gstr1Invoice {
  invoice_id: string;
  invoice_number: string;
  date: string;
  customer_name: string;
  customer_gstin: string | null;
  place_of_supply: string;
  invoice_type: string;
  taxable_value: number;
  igst: number;
  cgst: number;
  sgst: number;
  total: number;
  hsn_summary: Gstr1HsnItem[];
}

export interface Gstr1Report {
  period: string;
  summary: {
    total_taxable_value: number;
    total_igst: number;
    total_cgst: number;
    total_sgst: number;
    total_invoices: number;
  };
  invoices: Gstr1Invoice[];
  hsn_summary: Gstr1HsnItem[];
}

export interface Gstr3bReport {
  period: string;
  "3_1": {
    taxable_outward: number;
    zero_rated: number;
    deemed_exports: number;
    reverse_charge: number;
    total_outward: number;
  };
  "3_2": { inter_state: number; intra_state: number };
  "4": { total_igst: number; total_cgst: number; total_sgst: number; total_cess: number };
  "5": {
    eligible_itc_igst: number;
    eligible_itc_cgst: number;
    eligible_itc_sgst: number;
    ineligible_itc: number;
  };
  "6": {
    tax_payable_igst: number;
    tax_payable_cgst: number;
    tax_payable_sgst: number;
    interest: number;
    late_fee: number;
    total_tax_payable: number;
  };
}

// ---------- Inventory / Stock ----------
export interface StockLevel {
  id: number;
  product_id: string;
  product_name: string;
  product_sku: string | null;
  brand?: string | null;
  stock_quantity: number;
  reserved_qty: number;
  available_qty: number;
}

export interface StockMove {
  id: number;
  product_id: string;
  product_name: string;
  type: string;
  reference_type?: string | null;
  reference_id?: string | null;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  location?: string | null;
  notes?: string | null;
  move_date: string;
}

export interface StockSummary {
  total_products: number;
  total_stock_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

export type StockLevelList = Paginated & { products: StockLevel[] };
export type StockMoveList = Paginated & { moves: StockMove[] };

// ---------- Pagination (A22) ----------
export interface Paginated {
  total: number;
  page: number;
  limit: number;
}
export type ContactList = Paginated & { contacts: Contact[] };
export type ProductList = Paginated & { products: Product[] };
export type BrandList = Paginated & { brands: Brand[] };
export type InvoiceList = Paginated & { invoices: InvoiceListRow[] };
export type BillList = Paginated & { bills: BillListRow[] };
export type SalesOrderList = Paginated & { sales_orders: SalesOrderRow[] };
export type PurchaseOrderList = Paginated & {
  purchase_orders: PurchaseOrderRow[];
};
export type PaymentList = Paginated & { payments: PaymentRow[] };
export type CreditNoteList = Paginated & { credit_notes: CreditNoteListRow[] };
export type BudgetList = Paginated & { budgets: BudgetListRow[] };
export type UserList = Paginated & { users: User[] };
export type JournalEntryList = Paginated & {
  journal_entries: JournalEntryRow[];
};

// ---------- Audit Log ----------
export interface AuditLogEntry {
  id: number;
  user_id?: string;
  user_name?: string;
  action: string;
  entity: string;
  entity_id?: string;
  entity_name?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
export type AuditLogList = Paginated & { logs: AuditLogEntry[] };

// ---------- Error (universal) ----------
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    field: string | null;
    details?: Record<string, unknown>;
  };
}
