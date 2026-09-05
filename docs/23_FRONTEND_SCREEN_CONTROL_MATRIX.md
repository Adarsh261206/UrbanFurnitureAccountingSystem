# 23 — Frontend Screen Control Matrix

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Date:** 2026-09-05

---

## 1. Login Screen

| Element | Type | Visible To | Enabled When | Click/Action | API Call | Success | Failure | Navigation |
|---------|------|------------|--------------|--------------|----------|---------|---------|------------|
| App Logo | Image | All | Always | None | — | — | — | — |
| Login ID Input | Text | All | Always | Focus | — | — | — | — |
| Password Input | Password | All | Always | Focus | — | — | — | — |
| SIGN IN Button | Button | All | Form valid | Submit form | POST /auth/login | Store user, redirect to /dashboard | Show error message | /dashboard |
| Forgot Password Link | Link | All | Always | Click | — | — | — | /forgot-password |
| Sign Up Link | Link | All | Always | Click | — | — | — | /signup |

---

## 2. Sign Up Screen

| Element | Type | Visible To | Enabled When | Click/Action | API Call | Success | Failure | Navigation |
|---------|------|------------|--------------|--------------|----------|---------|---------|------------|
| Login ID Input | Text | All | Always | Focus | — | — | — | — |
| Email Input | Email | All | Always | Focus | — | — | — | — |
| Password Input | Password | All | Always | Focus | — | — | — | — |
| Re-Enter Password | Password | All | Always | Focus | — | — | — | — |
| SIGN UP Button | Button | All | Form valid | Submit form | POST /auth/signup | Show success, redirect to /login | Show error | /login |
| Back to Login Link | Link | All | Always | Click | — | — | — | /login |

---

## 3. Dashboard Screen

| Element | Type | Visible To | Enabled When | Click/Action | API Call | Success | Failure | Navigation |
|---------|------|------------|--------------|--------------|----------|---------|---------|------------|
| Account Tab | Tab | admin, accountant | Always | Click | — | — | — | Show Account sub-menu |
| Sales Tab | Tab | admin, accountant | Always | Click | — | — | — | Show Sales sub-menu |
| Purchase Tab | Tab | admin, accountant | Always | Click | — | — | — | Show Purchase sub-menu |
| Report Tab | Tab | admin, accountant | Always | Click | — | — | — | Show Report sub-menu |
| Contact Sub-menu | Link | admin, accountant | Account tab active | Click | — | — | — | /contacts |
| Product Sub-menu | Link | admin, accountant | Account tab active | Click | — | — | — | /products |
| Analyticals Sub-menu | Link | admin, accountant | Account tab active | Click | — | — | — | /analyticals/new |
| Analytical Budget Sub-menu | Link | admin, accountant | Account tab active | Click | — | — | — | /budgets |
| Chart of Account Sub-menu | Link | admin, accountant | Account tab active | Click | — | — | — | /chart-of-accounts |
| Journals Sub-menu | Link | admin, accountant | Account tab active | Click | — | — | — | /journals |
| Journal Entries Sub-menu | Link | admin, accountant | Account tab active | Click | — | — | — | /journal-entries |
| Sales Order Sub-menu | Link | admin, accountant | Sales tab active | Click | — | — | — | /sales-orders |
| Sale Invoice Sub-menu | Link | admin, accountant | Sales tab active | Click | — | — | — | /invoices |
| Receipt Sub-menu | Link | admin, accountant | Sales tab active | Click | — | — | — | /receipts |
| Purchase Order Sub-menu | Link | admin, accountant | Purchase tab active | Click | — | — | — | /purchase-orders |
| Purchase Bill Sub-menu | Link | admin, accountant | Purchase tab active | Click | — | — | — | /bills |
| Payment Sub-menu | Link | admin, accountant | Purchase tab active | Click | — | — | — | /payments |
| Balancesheet Sub-menu | Link | admin, accountant | Report tab active | Click | — | — | — | /reports/balance-sheet |
| Profit and Loss Sub-menu | Link | admin, accountant | Report tab active | Click | — | — | — | /reports/profit-and-loss |
| Budget Report Sub-menu | Link | admin, accountant | Report tab active | Click | — | — | — | /reports/budget-report |
| Sales Kanban Cards | Cards | admin, accountant | Sales tab active | None | GET /invoices (counts) | Display counts | Show error | — |
| Purchase Kanban Cards | Cards | admin, accountant | Purchase tab active | None | GET /bills (counts) | Display counts | Show error | — |
| Budget Kanban Cards | Cards | admin, accountant | Report tab active | None | GET /budgets (counts) | Display counts | Show error | — |
| New Button | Button | admin, accountant | Context-dependent | Click | — | — | — | Context-relevant form |

---

## 4. Contact List Screen

| Element | Type | Visible To | Enabled When | Click/Action | API Call | Success | Failure | Navigation |
|---------|------|------------|--------------|--------------|----------|---------|---------|------------|
| Search Input | Text | admin, accountant | Always | Type | GET /contacts?search= | Filter results | Show error | — |
| List/Kanban Toggle | Toggle | admin, accountant | Always | Click | — | Switch view | — | — |
| New Button | Button | admin, accountant | Always | Click | — | — | — | /contacts/new |
| Back Button | Button | admin, accountant | Always | Click | — | — | — | /dashboard |
| Contact Row | Row | admin, accountant | Always | Click | GET /contacts/:id | — | — | /contacts/:id |
| Pagination | Controls | admin, accountant | total > limit | Click page | GET /contacts?page= | Load page | Show error | — |

---

## 5. Contact Form Screen

| Element | Type | Visible To | Enabled When | Click/Action | API Call | Success | Failure | Navigation |
|---------|------|------------|--------------|--------------|----------|---------|---------|------------|
| Contact Name Input | Text | admin, accountant | Always | Focus | — | — | — | — |
| Email Input | Email | admin, accountant | Always | Focus | — | — | — | — |
| Phone Input | Text | admin, accountant | Always | Focus | — | — | — | — |
| Image Upload | File | admin, accountant | Always | Select file | POST /upload | Set image_url | Show error | — |
| Street Input | Text | admin, accountant | Always | Focus | — | — | — | — |
| City Input | Text | admin, accountant | Always | Focus | — | — | — | — |
| State Input | Text | admin, accountant | Always | Focus | — | — | — | — |
| Country Input | Text | admin, accountant | Always | Focus | — | — | — | — |
| Pincode Input | Text | admin, accountant | Always | Focus | — | — | — | — |
| New Button | Button | admin, accountant | Always | Click | — | Clear form | — | — |
| Confirm Button | Button | admin, accountant | Form valid | Click | POST /contacts (new) or PUT /contacts/:id (edit) | Show success | Show error | /contacts |
| Back Button | Button | admin, accountant | Always | Click | — | — | — | /contacts |
| Search Button | Button | admin, accountant | Always | Click | — | — | — | /contacts |

---

## 6. Product List Screen

| Element | Type | Visible To | Enabled When | Click/Action | API Call | Success | Failure | Navigation |
|---------|------|------------|--------------|--------------|----------|---------|---------|------------|
| Search Input | Text | admin, accountant | Always | Type | GET /products?search= | Filter results | Show error | — |
| List/Kanban Toggle | Toggle | admin, accountant | Always | Click | — | Switch view | — | — |
| New Button | Button | admin, accountant | Always | Click | — | — | — | /products/new |
| Back Button | Button | admin, accountant | Always | Click | — | — | — | /dashboard |
| Product Row | Row | admin, accountant | Always | Click | GET /products/:id | — | — | /products/:id |
| Pagination | Controls | admin, accountant | total > limit | Click page | GET /products?page= | Load page | Show error | — |

---

## 7. Product Form Screen

| Element | Type | Visible To | Enabled When | Click/Action | API Call | Success | Failure | Navigation |
|---------|------|------------|--------------|--------------|----------|---------|---------|------------|
| Product Name Input | Text | admin, accountant | Always | Focus | — | — | — | — |
| Image Upload | File | admin, accountant | Always | Select file | POST /upload | Set image_url | Show error | — |
| Product Type Dropdown | Dropdown | admin, accountant | Always | Select | — | — | — | — |
| Category Dropdown | Dropdown | admin, accountant | Always | Select or type to create | POST /categories (on fly) | Create category | Show error | — |
| Sales Price Input | Number | admin, accountant | Always | Focus | — | — | — | — |
| Cost Input | Number | admin, accountant | Always | Focus | — | — | — | — |
| Confirm Button | Button | admin, accountant | Form valid | Click | POST /products (new) or PUT /products/:id (edit) | Show success | Show error | /products |
| Back Button | Button | admin, accountant | Always | Click | — | — | — | /products |

---

## 8. Invoice List Screen

| Element | Type | Visible To | Enabled When | Click/Action | API Call | Success | Failure | Navigation |
|---------|------|------------|--------------|--------------|----------|---------|---------|------------|
| Search Input | Text | admin, accountant, user (own) | Always | Type | GET /invoices?search= | Filter results | Show error | — |
| Status Filter | Dropdown | admin, accountant | Always | Select | GET /invoices?status= | Filter results | — | — |
| New Button | Button | admin, accountant | Always | Click | — | — | — | /invoices/new |
| Back Button | Button | admin, accountant | Always | Click | — | — | — | /dashboard |
| Invoice Row | Row | admin, accountant, user (own) | Always | Click | GET /invoices/:id | — | — | /invoices/:id |
| Pagination | Controls | admin, accountant, user (own) | total > limit | Click page | GET /invoices?page= | Load page | Show error | — |

---

## 9. Invoice Form Screen

| Element | Type | Visible To | Enabled When | Click/Action | API Call | Success | Failure | Navigation |
|---------|------|------------|--------------|--------------|----------|---------|---------|------------|
| Customer Dropdown | Dropdown | admin, accountant | status = draft | Select | GET /contacts | Set customer | — | — |
| Invoice Date Input | Date | admin, accountant | status = draft | Select | — | — | — | — |
| Due Date Input | Date | admin, accountant | status = draft | Select | — | — | — | — |
| Payment Type Dropdown | Dropdown | admin, accountant | status = draft | Select | — | — | — | — |
| Payment Via Dropdown | Dropdown | admin, accountant | status = draft | Select | — | — | — | — |
| Add Line Button | Button | admin, accountant | status = draft | Click | — | Add row | — | — |
| Line Product Dropdown | Dropdown | admin, accountant | status = draft | Select | GET /products | Set product, price | — | — |
| Line Qty Input | Number | admin, accountant | status = draft | Focus | — | Calculate total | — | — |
| Line Unit Price Input | Number | admin, accountant | status = draft | Focus | — | Calculate total | — | — |
| Line Total | Computed | admin, accountant | Read-only | None | — | — | — | — |
| Remove Line Button | Button | admin, accountant | status = draft, lines > 1 | Click | — | Remove row | — | — |
| Create Invoice Button | Button | admin, accountant | status = draft, from SO | Click | POST /invoices (from SO) | Show success | Show error | /invoices/:id |
| Confirm Button | Button | admin, accountant | status = draft, lines valid | Click | POST /invoices/:id/confirm | Show success | Show error | /invoices/:id |
| Cancel Button | Button | admin, accountant | status = draft | Click | DELETE /invoices/:id | Show success | Show error | /invoices |
| Back Button | Button | admin, accountant | Always | Click | — | — | — | /invoices |
| Pay Button | Button | admin, accountant, user (own) | status = confirmed, amount_due > 0 | Click | — | — | — | /invoices/:id/pay |
| Print Button | Button | admin, accountant, user (own) | status != draft | Click | POST /invoices/:id/print | Download PDF | Show error | — |
| Send Button | Button | admin, accountant, user (own) | status != draft | Click | POST /invoices/:id/send | Show success | Show error | — |

---

## 10. Invoice Payment Screen

| Element | Type | Visible To | Enabled When | Click/Action | API Call | Success | Failure | Navigation |
|---------|------|------------|--------------|--------------|----------|---------|---------|------------|
| Total Display | Text | admin, accountant, user (own) | Read-only | None | — | — | — | — |
| Amount Due Display | Text | admin, accountant, user (own) | Read-only | None | — | — | — | — |
| Paid Via Dropdown | Dropdown | admin, accountant, user (own) | Always | Select | — | — | — | — |
| Amount Input | Number | admin, accountant, user (own) | amount_due > 0 | Focus | — | Validate <= amount_due | — | — |
| Pay Button | Button | admin, accountant, user (own) | amount valid | Click | POST /invoices/:id/pay | Show success | Show error | /invoices/:id |
| Back Button | Button | admin, accountant, user (own) | Always | Click | — | — | — | /invoices/:id |
| Reset to Draft Button | Button | admin, accountant | status = draft | Click | PUT /invoices/:id/reset | Show success | Show error | /invoices/:id |

---

## 11. Bill List Screen

| Element | Type | Visible To | Enabled When | Click/Action | API Call | Success | Failure | Navigation |
|---------|------|------------|--------------|--------------|----------|---------|---------|------------|
| Search Input | Text | admin, accountant | Always | Type | GET /bills?search= | Filter results | Show error | — |
| Status Filter | Dropdown | admin, accountant | Always | Select | GET /bills?status= | Filter results | — | — |
| New Button | Button | admin, accountant | Always | Click | — | — | — | /bills/new |
| Back Button | Button | admin, accountant | Always | Click | — | — | — | /dashboard |
| Bill Row | Row | admin, accountant | Always | Click | GET /bills/:id | — | — | /bills/:id |
| Pagination | Controls | admin, accountant | total > limit | Click page | GET /bills?page= | Load page | Show error | — |

---

## 12. Bill Form Screen

| Element | Type | Visible To | Enabled When | Click/Action | API Call | Success | Failure | Navigation |
|---------|------|------------|--------------|--------------|----------|---------|---------|------------|
| Vendor Dropdown | Dropdown | admin, accountant | status = draft | Select | GET /contacts | Set vendor | — | — |
| Bill Date Input | Date | admin, accountant | status = draft | Select | — | — | — | — |
| Due Date Input | Date | admin, accountant | status = draft | Select | — | — | — | — |
| Vendor Bill No Input | Text | admin, accountant | status = draft | Focus | — | — | — | — |
| Payment Type Dropdown | Dropdown | admin, accountant | status = draft | Select | — | — | — | — |
| Payment Via Dropdown | Dropdown | admin, accountant | status = draft | Select | — | — | — | — |
| Add Line Button | Button | admin, accountant | status = draft | Click | — | Add row | — | — |
| Line Product Dropdown | Dropdown | admin, accountant | status = draft | Select | GET /products | Set product, price | — | — |
| Line Qty Input | Number | admin, accountant | status = draft | Focus | — | Calculate total | — | — |
| Line Unit Price Input | Number | admin, accountant | status = draft | Focus | — | Calculate total | — | — |
| Line Total | Computed | admin, accountant | Read-only | None | — | — | — | — |
| Remove Line Button | Button | admin, accountant | status = draft, lines > 1 | Click | — | Remove row | — | — |
| Create Bill Button | Button | admin, accountant | status = draft, from PO | Click | POST /bills (from PO) | Show success | Show error | /bills/:id |
| Confirm Button | Button | admin, accountant | status = draft, lines valid | Click | POST /bills/:id/confirm | Show success | Show error | /bills/:id |
| Cancel Button | Button | admin, accountant | status = draft | Click | DELETE /bills/:id | Show success | Show error | /bills |
| Back Button | Button | admin, accountant | Always | Click | — | — | — | /bills |
| Pay Button | Button | admin, accountant | status = confirmed, amount_due > 0 | Click | — | — | — | /bills/:id/pay |
| Print Button | Button | admin, accountant | status != draft | Click | POST /bills/:id/print | Download PDF | Show error | — |
| Send Button | Button | admin, accountant | status != draft | Click | POST /bills/:id/send | Show success | Show error | — |

---

## 13. Bill Payment Screen

| Element | Type | Visible To | Enabled When | Click/Action | API Call | Success | Failure | Navigation |
|---------|------|------------|--------------|--------------|----------|---------|---------|------------|
| Total Display | Text | admin, accountant | Read-only | None | — | — | — | — |
| Amount Due Display | Text | admin, accountant | Read-only | None | — | — | — | — |
| Paid Via Dropdown | Dropdown | admin, accountant | Always | Select | — | — | — | — |
| Amount Input | Number | admin, accountant | amount_due > 0 | Focus | — | Validate <= amount_due | — | — |
| Pay Button | Button | admin, accountant | amount valid | Click | POST /bills/:id/pay | Show success | Show error | /bills/:id |
| Back Button | Button | admin, accountant | Always | Click | — | — | — | /bills/:id |
| Reset to Draft Button | Button | admin, accountant | status = draft | Click | PUT /bills/:id/reset | Show success | Show error | /bills/:id |

---

## 14. Journal Entry Form Screen

| Element | Type | Visible To | Enabled When | Click/Action | API Call | Success | Failure | Navigation |
|---------|------|------------|--------------|--------------|----------|---------|---------|------------|
| Accounting Date Input | Date | admin, accountant | Always | Select | — | — | — | — |
| Journal Dropdown | Dropdown | admin, accountant | Always | Select | GET /journals | Set journal | — | — |
| Add Line Button | Button | admin, accountant | Always | Click | — | Add row | — | — |
| Line Account Dropdown | Dropdown | admin, accountant | Always | Select | GET /chart-of-accounts | Set account | — | — |
| Line Partner Dropdown | Dropdown | admin, accountant | Always | Select | GET /contacts | Set partner | — | — |
| Line Debit Input | Number | admin, accountant | Always | Focus | — | Validate, update totals | — | — |
| Line Credit Input | Number | admin, accountant | Always | Focus | — | Validate, update totals | — | — |
| Remove Line Button | Button | admin, accountant | lines > 1 | Click | — | Remove row | — | — |
| Total Debit Display | Text | admin, accountant | Read-only | None | — | — | — | — |
| Total Credit Display | Text | admin, accountant | Read-only | None | — | — | — | — |
| Balance Indicator | Text | admin, accountant | Read-only | None | — | Show balanced/unbalanced | — | — |
| Confirm Button | Button | admin, accountant | Balanced, lines valid | Click | POST /journal-entries | Show success | Show error | /journal-entries/:id |
| Back Button | Button | admin, accountant | Always | Click | — | — | — | /journal-entries |

---

## 15. P&L Report Screen

| Element | Type | Visible To | Enabled When | Click/Action | API Call | Success | Failure | Navigation |
|---------|------|------------|--------------|--------------|----------|---------|---------|------------|
| Year Selector | Dropdown | admin, accountant | Always | Select | GET /reports/profit-and-loss?year= | Display report | Show error | — |
| Income Section | Table | admin, accountant | Always | None | — | Display items | — | — |
| Income Total | Text | admin, accountant | Read-only | None | — | — | — | — |
| Expenses Section | Table | admin, accountant | Always | None | — | Display items | — | — |
| Expenses Total | Text | admin, accountant | Read-only | None | — | — | — | — |
| Net Income | Text | admin, accountant | Read-only | None | — | — | — | — |
| Back Button | Button | admin, accountant | Always | Click | — | — | — | /dashboard |
| Print Button | Button | admin, accountant | Always | Click | GET /reports/profit-and-loss?year=&format=pdf | Download PDF | Show error | — |

---

## 16. Balance Sheet Screen

| Element | Type | Visible To | Enabled When | Click/Action | API Call | Success | Failure | Navigation |
|---------|------|------------|--------------|--------------|----------|---------|---------|------------|
| Year Selector | Dropdown | admin, accountant | Always | Select | GET /reports/balance-sheet?year= | Display report | Show error | — |
| Assets Section | Table | admin, accountant | Always | None | — | Display items | — | — |
| Assets Total | Text | admin, accountant | Read-only | None | — | — | — | — |
| Liabilities Section | Table | admin, accountant | Always | None | — | Display items | — | — |
| Liabilities Total | Text | admin, accountant | Read-only | None | — | — | — | — |
| Balance Check | Text | admin, accountant | Read-only | None | — | Show "Balanced" or "Unbalanced" | — | — |
| Back Button | Button | admin, accountant | Always | Click | — | — | — | /dashboard |
| Print Button | Button | admin, accountant | Always | Click | GET /reports/balance-sheet?year=&format=pdf | Download PDF | Show error | — |

---

*Document generated from frontend screen control analysis on 2026-09-05*
