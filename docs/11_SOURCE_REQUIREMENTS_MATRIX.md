# 11 — Source Requirements Matrix

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Source:** Excalidraw Mockup + PDF Problem Statement (attached but not extracted)  
> **Date:** 2026-09-05

---

## 1. Classification Legend

| Code | Meaning |
|------|---------|
| SOURCE_REQUIRED | Explicitly required by source material |
| SOURCE_OPTIONAL | Mentioned but not mandatory |
| SOURCE_AMBIGUOUS | Source is unclear or contradictory |
| SOURCE_CONFLICT | Two source materials disagree |
| ENGINEERING_DECISION | Resolved by engineering judgment |
| NOT_SPECIFIED | Not addressed by source material |

---

## 2. Role Definitions

| Req ID | Requirement | Source | Classification |
|--------|------------|--------|----------------|
| ROLE-001 | Admin — "Have all access rights" | Excalidraw annotation | SOURCE_REQUIRED |
| ROLE-002 | User — "can only see his invoices/bills in paid/unpaid status and can directly pay his dues from portal" | Excalidraw annotation | SOURCE_REQUIRED |
| ROLE-003 | Accountant — "Create Master data, record Transactions and View reports" | Excalidraw annotation | SOURCE_REQUIRED |
| ROLE-004 | Accountant — "Can manage customers/vendors, access accounting dashboard, create journal entries" | Excalidraw annotation | SOURCE_REQUIRED |
| ROLE-005 | Accountant — "Can create and manage invoices, bills, and payments" | Excalidraw annotation | SOURCE_REQUIRED |
| ROLE-006 | Role field on Create User form shows only "User" and "Administrator" (2 options) | Excalidraw mockup Screen 1 | SOURCE_AMBIGUOUS |
| ROLE-007 | Three roles defined in annotations (Admin, User, Accountant) | Excalidraw annotation | SOURCE_REQUIRED |
| ROLE-008 | Sign Up creates "invoicing user" only | Excalidraw annotation on Sign Up screen | SOURCE_REQUIRED |

---

## 3. Authentication

| Req ID | Requirement | Source | Classification |
|--------|------------|--------|----------------|
| AUTH-001 | Login with Login ID and Password | Excalidraw Screen 2 (Login) | SOURCE_REQUIRED |
| AUTH-002 | Login ID: 6-12 characters, unique | Excalidraw Create User form annotation | SOURCE_REQUIRED |
| AUTH-003 | Password: must contain uppercase, lowercase, special char, >8 chars | Excalidraw Create User form annotation | SOURCE_REQUIRED |
| AUTH-004 | "Password must be unique" | Excalidraw annotation | SOURCE_AMBIGUOUS |
| AUTH-005 | Login error message: "Invalid Login Id or Password" | Excalidraw annotation | SOURCE_REQUIRED |
| AUTH-006 | Forgot Password link on Login page | Excalidraw Screen 2 | SOURCE_REQUIRED |
| AUTH-007 | Sign Up link on Login page | Excalidraw Screen 2 | SOURCE_REQUIRED |
| AUTH-008 | Sign Up page has "SIGN OUT" button (likely mislabeled) | Excalidraw Screen 2 | SOURCE_AMBIGUOUS |
| AUTH-009 | Create User form: Admin-only | Excalidraw Screen 1 | SOURCE_REQUIRED |
| AUTH-010 | Create User fields: Name, Login Id, E-mail id, Role, Password, Re-Enter Password | Excalidraw Screen 1 | SOURCE_REQUIRED |

---

## 4. Dashboard

| Req ID | Requirement | Source | Classification |
|--------|------------|--------|----------------|
| DAS-001 | Dashboard has tabs: Account, Sales, Purchase, Report | Excalidraw Screen 3 | SOURCE_REQUIRED |
| DAS-002 | Account tab sub-items: Contact, Product, Analyticals, Analytical Budget, Chart of Account, Journals, Journal Entries | Excalidraw Screen 3 | SOURCE_REQUIRED |
| DAS-003 | Sales tab sub-items: Sales Order, Sale Invoice, Receipt | Excalidraw Screen 3 | SOURCE_REQUIRED |
| DAS-004 | Purchase tab sub-items: Purchase Order, Purchase Bill, Payment | Excalidraw Screen 3 | SOURCE_REQUIRED |
| DAS-005 | Report tab sub-items: Balancesheet, Profit and Loss, Budget Report | Excalidraw Screen 3 | SOURCE_REQUIRED |
| DAS-006 | Kanban cards: Sales (All/Confirmed/Draft), Purchase (All/Confirmed/Draft), Budget Reports (Achieved/Committed/Budget) | Excalidraw Screen 3 | SOURCE_REQUIRED |
| DAS-007 | "New" button on dashboard opens context-relevant blank form | Excalidraw Screen 3 | SOURCE_REQUIRED |

---

## 5. Contact Management

| Req ID | Requirement | Source | Classification |
|--------|------------|--------|----------------|
| CON-001 | Contact List view (default) | Excalidraw Screen 4 | SOURCE_REQUIRED |
| CON-002 | Contact Kanban view (toggle) | Excalidraw Screen 4 | SOURCE_REQUIRED |
| CON-003 | Contact Form: Contact Name, Email, Phone, Upload Image | Excalidraw Screen 4 | SOURCE_REQUIRED |
| CON-004 | Address fields: Street, City, State, Country, Pincode | Excalidraw Screen 4 | SOURCE_REQUIRED |
| CON-005 | Email must be unique | Excalidraw annotation | SOURCE_REQUIRED |
| CON-006 | List/Kanban view toggle | Excalidraw annotation | SOURCE_REQUIRED |
| CON-007 | "New" button opens blank form | Excalidraw annotation | SOURCE_REQUIRED |
| CON-008 | "Back" button returns to dashboard | Excalidraw annotation | SOURCE_REQUIRED |

---

## 6. Product Management

| Req ID | Requirement | Source | Classification |
|--------|------------|--------|----------------|
| PRD-001 | Product List view (default) | Excalidraw Screen 5 | SOURCE_REQUIRED |
| PRD-002 | Product Kanban view (toggle) | Excalidraw Screen 5 | SOURCE_REQUIRED |
| PRD-003 | Product Form: Product Name, Image, Product Type | Excalidraw Screen 5 | SOURCE_REQUIRED |
| PRD-004 | Product Type options: Goods, Service, Combo | Excalidraw Screen 5 | SOURCE_REQUIRED |
| PRD-005 | Category: Many2one (created on the fly) | Excalidraw Screen 5 | SOURCE_REQUIRED |
| PRD-006 | Sales Price: Monetary (Rs.) | Excalidraw Screen 5 | SOURCE_REQUIRED |
| PRD-007 | Cost: Monetary (Rs.) | Excalidraw Screen 5 | SOURCE_REQUIRED |

---

## 7. Analytical Accounts

| Req ID | Requirement | Source | Classification |
|--------|------------|--------|----------------|
| ANA-001 | Analyticals Form: Budget Name, Responsible, Start Date, To, End Date, Analytic Account | Excalidraw Screen 8 | SOURCE_REQUIRED |
| ANA-002 | Responsible: Many2one to Contact | Excalidraw Screen 8 | SOURCE_REQUIRED |
| ANA-003 | Three date fields: Start Date, To, End Date | Excalidraw Screen 8 | SOURCE_REQUIRED |

---

## 8. Budget Management

| Req ID | Requirement | Source | Classification |
|--------|------------|--------|----------------|
| BUD-001 | Budget Form: Budget Name, Responsible, Start Date, End Date, Type, Analytic Account | Excalidraw Screen 8 | SOURCE_REQUIRED |
| BUD-002 | Type options: Income, Expenses | Excalidraw Screen 8 | SOURCE_REQUIRED |
| BUD-003 | Committed Amount: Only visible at Confirmed stage | Excalidraw Screen 8 | SOURCE_REQUIRED |
| BUD-004 | Achieved Amount: Computed from invoices/bills | Excalidraw annotation | SOURCE_REQUIRED |
| BUD-005 | Achieved %: (Achieved/Committed)*100 | Excalidraw annotation | SOURCE_REQUIRED |
| BUD-006 | Amount To Achieve: Committed - Achieved | Excalidraw annotation | SOURCE_REQUIRED |
| BUD-007 | Budget states: Draft → Confirmed → Revised / Cancelled | Excalidraw annotation | SOURCE_REQUIRED |
| BUD-008 | "Revised: Only Visible for Confirmed Budget" | Excalidraw annotation | SOURCE_REQUIRED |
| BUD-009 | "On Clicking Revise — new Budget appears, old moves to Revised state, links between original and revised" | Excalidraw annotation | SOURCE_REQUIRED |
| BUD-010 | "Cancelled: Archive existing budget" | Excalidraw annotation | SOURCE_REQUIRED |
| BUD-011 | Budget Report shows: Name, Period, Committed, Achieved, %, Status | Excalidraw Screen 8 | SOURCE_REQUIRED |

---

## 9. Chart of Accounts

| Req ID | Requirement | Source | Classification |
|--------|------------|--------|----------------|
| COA-001 | Chart of Account Form: Account Name, Type | Excalidraw Screen 6 | SOURCE_REQUIRED |
| COA-002 | Type options: Asset, Liability, Bank, Capital, Cash | Excalidraw Screen 6 | SOURCE_REQUIRED |
| COA-003 | "All accounts are to be pre configured" | Excalidraw annotation | SOURCE_REQUIRED |
| COA-004 | "Each account is assigned an Account Type, which would further be used for how the account to be treated and where it appears in reports" | Excalidraw annotation | SOURCE_REQUIRED |

---

## 10. Journals

| Req ID | Requirement | Source | Classification |
|--------|------------|--------|----------------|
| JNL-001 | Journals List view | Excalidraw Screen 6 | SOURCE_REQUIRED |
| JNL-002 | Pre-configured: Sales, Purchase, Bank, Cash | Excalidraw annotation | SOURCE_REQUIRED |
| JNL-003 | Journal Entry Form: Accounting Date, Journal, Lines | Excalidraw Screen 6 | SOURCE_REQUIRED |
| JNL-004 | Lines: Account, Partner, Debit, Credit | Excalidraw Screen 6 | SOURCE_REQUIRED |
| JNL-005 | "Blocking warning if the debit and credit amount don't match" | Excalidraw annotation | SOURCE_REQUIRED |
| JNL-006 | "The Journal Entry should always be balanced (debit and credit totals need to match)" | Excalidraw annotation | SOURCE_REQUIRED |

---

## 11. Sales & Customer Invoicing

| Req ID | Requirement | Source | Classification |
|--------|------------|--------|----------------|
| INV-001 | Customer Invoice Form: Invoice Reference, Customer Invoice No., SO No., Date, Invoice Date, Customer Name, Due Date, Payment Type, Partner, Payment Via, Amount | Excalidraw Screen 12 | SOURCE_REQUIRED |
| INV-002 | Lines: Sr. No., Product, Chart of Account, Budget Analytics, Qty, Unit Price, Total | Excalidraw Screen 12 | SOURCE_REQUIRED |
| INV-003 | "As soon as the Customer Invoice is confirmed a journal entry would be created" | Excalidraw annotation | SOURCE_REQUIRED |
| INV-004 | "For Customer Invoice always Sales chart of account would be set by default" | Excalidraw annotation | SOURCE_REQUIRED |
| INV-005 | Invoice Reference format: INV/YYYY/NNNN | Excalidraw annotation | SOURCE_REQUIRED |
| INV-006 | Invoice states: Draft → Confirmed → Paid | Excalidraw annotation + mockup | SOURCE_REQUIRED |
| INV-007 | Invoice confirmation creates journal entry: DEBIT Debtor, CREDIT Sales Income | Excalidraw annotation | SOURCE_REQUIRED |
| INV-008 | Buttons: Create Invoice, Confirm, Cancel, Back, Pay, Print, Send | Excalidraw Screen 12 | SOURCE_REQUIRED |
| INV-009 | Payment Type: Receive or Send | Excalidraw Screen 12 | SOURCE_REQUIRED |
| INV-010 | Payment Via: Bank or Cash (default: Bank) | Excalidraw Screen 12 | SOURCE_REQUIRED |

---

## 12. Sales Orders

| Req ID | Requirement | Source | Classification |
|--------|------------|--------|----------------|
| SO-001 | Sales Order Form | Excalidraw Screen 12 | SOURCE_REQUIRED |
| SO-002 | Auto-generated SO No. (S00001+1) | Excalidraw annotation | SOURCE_REQUIRED |
| SO-003 | SO lines similar to invoice lines | Excalidraw Screen 12 | SOURCE_REQUIRED |

---

## 13. Purchase & Vendor Bills

| Req ID | Requirement | Source | Classification |
|--------|------------|--------|----------------|
| BIL-001 | Vendor Bill Form: Bill Reference, Vendor Bill No., PO No., Date, Bill Date, Vendor Name, Due Date, Payment Type, Partner, Payment Via, Amount | Excalidraw Screen 10 | SOURCE_REQUIRED |
| BIL-002 | Lines: Product, Chart of Account, Budget Analytics, Qty, Unit Price, Total | Excalidraw Screen 10 | SOURCE_REQUIRED |
| BIL-003 | "As soon as the vendor bill is confirmed a journal entry would be created" | Excalidraw annotation | SOURCE_REQUIRED |
| BIL-004 | "For Vendor bill always purchase chart of account would be set by default" | Excalidraw annotation | SOURCE_REQUIRED |
| BIL-005 | Bill Reference format: Bill/YYYY/NNNN | Excalidraw annotation | SOURCE_REQUIRED |
| BIL-006 | Bill states: Draft → Confirmed → Paid | Excalidraw annotation | SOURCE_REQUIRED |
| BIL-007 | Bill confirmation creates journal entry: DEBIT Purchase Expense, CREDIT Creditor | Excalidraw annotation | SOURCE_REQUIRED |
| BIL-008 | Buttons: Create Bill, Confirm, Cancel, Back, Pay, Print, Send | Excalidraw Screen 10 | SOURCE_REQUIRED |

---

## 14. Purchase Orders

| Req ID | Requirement | Source | Classification |
|--------|------------|--------|----------------|
| PO-001 | Purchase Order Form | Excalidraw Screen 10 | SOURCE_REQUIRED |
| PO-002 | Auto-generated PO No. (P00001+1) | Excalidraw annotation | SOURCE_REQUIRED |

---

## 15. Payments

| Req ID | Requirement | Source | Classification |
|--------|------------|--------|----------------|
| PAY-001 | Payment View: Total, Paid Via, Amount Due | Excalidraw Screen 11, 13 | SOURCE_REQUIRED |
| PAY-002 | Buttons: Pay, Back, Reset to Draft | Excalidraw Screen 11, 13 | SOURCE_REQUIRED |
| PAY-003 | Invoice Payment: DEBIT Bank/Cash, CREDIT Debtor | Excalidraw annotation | SOURCE_REQUIRED |
| PAY-004 | Bill Payment: DEBIT Creditor, CREDIT Bank/Cash | Excalidraw annotation | SOURCE_REQUIRED |

---

## 16. Reports

| Req ID | Requirement | Source | Classification |
|--------|------------|--------|----------------|
| RPT-001 | Profit and Loss Report: Income section, Expenses section, Net Income | Excalidraw Screen 14 | SOURCE_REQUIRED |
| RPT-002 | Balance Sheet: Assets, Liabilities | Excalidraw Screen 14 | SOURCE_REQUIRED |
| RPT-003 | "The Total of All asset and liability would always match" | Excalidraw annotation | SOURCE_REQUIRED |
| RPT-004 | P&L types: Income, Expenses, Other Expenses | Excalidraw annotation | SOURCE_REQUIRED |
| RPT-005 | Budget Report: Name, Period, Committed, Achieved, %, Status | Excalidraw Screen 8 | SOURCE_REQUIRED |
| RPT-006 | Reports have Print and Back buttons | Excalidraw Screen 14 | SOURCE_REQUIRED |

---

## 17. Numbering/Sequences

| Req ID | Requirement | Source | Classification |
|--------|------------|--------|----------------|
| SEQ-001 | SO No.: S00001+1 | Excalidraw annotation | SOURCE_REQUIRED |
| SEQ-002 | Invoice Reference: INV/YYYY/NNNN | Excalidraw annotation | SOURCE_REQUIRED |
| SEQ-003 | PO No.: P00001+1 | Excalidraw annotation | SOURCE_REQUIRED |
| SEQ-004 | Bill Reference: Bill/YYYY/NNNN | Excalidraw annotation | SOURCE_REQUIRED |

---

## 18. Business Rules

| Req ID | Requirement | Source | Classification |
|--------|------------|--------|----------------|
| BR-001 | "All accounts are to be pre configured" | Excalidraw annotation | SOURCE_REQUIRED |
| BR-002 | Journal entries must be balanced | Excalidraw annotation | SOURCE_REQUIRED |
| BR-003 | Auto journal entry on invoice confirmation | Excalidraw annotation | SOURCE_REQUIRED |
| BR-004 | Auto journal entry on bill confirmation | Excalidraw annotation | SOURCE_REQUIRED |
| BR-005 | Balance Sheet must balance | Excalidraw annotation | SOURCE_REQUIRED |
| BR-006 | Budget achieved computed from matching analytics in invoices/bills | Excalidraw annotation | SOURCE_REQUIRED |
| BR-007 | Budget revision creates new budget, links to original | Excalidraw annotation | SOURCE_REQUIRED |
| BR-008 | Budget cancellation archives | Excalidraw annotation | SOURCE_REQUIRED |
| BR-009 | List view as default for all masters | Excalidraw annotation | SOURCE_REQUIRED |
| BR-010 | Kanban view toggle allowed | Excalidraw annotation | SOURCE_REQUIRED |

---

## 19. NOT_SPECIFIED Items

| Item | Impact | Engineering Decision |
|------|--------|---------------------|
| Forgot Password implementation details | User lockout | Defer to post-hackathon |
| User profile editing | Users can't self-edit | Defer |
| User deletion/deactivation | Orphaned records risk | Defer |
| Contact/Product deletion | Data integrity | Defer |
| Session management details | Security | Use httpOnly cookie JWT |
| Email service for Send button | Feature incomplete | Mock implementation |
| PDF generation library | Print feature | Use html-pdf or puppeteer |
| Image upload storage | Storage strategy | Local filesystem |
| Multi-currency | Not needed | Out of scope |
| Tax calculation | Not needed | Out of scope |
| Budget line items structure | unclear if separate lines | Analytical account is the linking mechanism |
| Receipt list view columns | Missing detail | Map from invoice fields |
| Payment list view columns | Missing detail | Map from bill fields |
| Currency (Rs. shown) | Single currency | INR only |

---

*Document generated from source reconciliation on 2026-09-05*
