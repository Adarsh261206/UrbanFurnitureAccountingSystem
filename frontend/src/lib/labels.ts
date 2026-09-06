/**
 * Canonical display labels for backend enum values.
 * Backend values stay lowercase/canonical — the UI always renders these labels.
 */
export const ENUM_LABELS: Record<string, string> = {
  // Document statuses
  draft: "Draft",
  confirmed: "Confirmed",
  posted: "Posted",
  paid: "Paid",
  partially_paid: "Partially Paid",
  cancelled: "Cancelled",
  revised: "Revised",
  pending: "Pending",
  rejected: "Rejected",

  // Contact / party types
  customer: "Customer",
  vendor: "Vendor",
  both: "Customer & Vendor",

  // Roles
  admin: "Admin",
  accountant: "Accountant",
  user: "User",

  // Product types
  goods: "Goods",
  service: "Service",
  combo: "Combo",

  // Account types
  asset: "Asset",
  liability: "Liability",
  bank: "Bank",
  capital: "Capital",
  cash: "Cash",
  income: "Income",
  expense: "Expense",

  // Budget types / statuses (income/expense already mapped above)

  // Journal types
  sale: "Sale",
  purchase: "Purchase",

  // Credit note types
  credit_note: "Credit Note",
  debit_note: "Debit Note",

  // Payment via / statuses
  successful: "Successful",
  failed: "Failed",

  // Stock move types
  adjustment: "Adjustment",
  return_in: "Return In",
  return_out: "Return Out",

  // Flags
  active: "Active",
  inactive: "Inactive",
  enabled: "Enabled",
  disabled: "Disabled",
};

/** Display label for any enum value — falls back to a capitalized guess. */
export function enumLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return ENUM_LABELS[value] ?? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
