# 29 — UI Control Test Matrix

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Date:** 2026-09-05

---

## 1. Login Screen Tests

| Test ID | Control | Action | Expected | Pass |
|---------|---------|--------|----------|------|
| UI-LOGIN-001 | Login ID input | Type valid ID | Input accepted | — |
| UI-LOGIN-002 | Login ID input | Type < 6 chars | Validation error | — |
| UI-LOGIN-003 | Login ID input | Type > 12 chars | Validation error | — |
| UI-LOGIN-004 | Password input | Type valid password | Input accepted | — |
| UI-LOGIN-005 | SIGN IN button | Click with valid credentials | Redirect to /dashboard | — |
| UI-LOGIN-006 | SIGN IN button | Click with invalid credentials | Error message displayed | — |
| UI-LOGIN-007 | SIGN IN button | Double click | Single request sent | — |
| UI-LOGIN-008 | Forgot Password link | Click | Navigate to /forgot-password | — |
| UI-LOGIN-009 | Sign Up link | Click | Navigate to /signup | — |
| UI-LOGIN-010 | Browser refresh | Refresh on login page | Stay on login page | — |

---

## 2. Sign Up Screen Tests

| Test ID | Control | Action | Expected | Pass |
|---------|---------|--------|----------|------|
| UI-SIGNUP-001 | Login ID input | Type valid ID (6-12 chars) | Input accepted | — |
| UI-SIGNUP-002 | Login ID input | Type < 6 chars | Validation error | — |
| UI-SIGNUP-003 | Email input | Type valid email | Input accepted | — |
| UI-SIGNUP-004 | Email input | Type invalid email | Validation error | — |
| UI-SIGNUP-005 | Password input | Type weak password | Validation error | — |
| UI-SIGNUP-006 | Password input | Type strong password | Input accepted | — |
| UI-SIGNUP-007 | Re-Enter Password | Type matching password | No error | — |
| UI-SIGNUP-008 | Re-Enter Password | Type non-matching password | Validation error | — |
| UI-SIGNUP-009 | SIGN UP button | Click with valid data | Redirect to /login | — |
| UI-SIGNUP-010 | Back to Login link | Click | Navigate to /login | — |

---

## 3. Dashboard Screen Tests

| Test ID | Control | Action | Expected | Pass |
|---------|---------|--------|----------|------|
| UI-DASH-001 | Account tab | Click | Show Account sub-menu | — |
| UI-DASH-002 | Sales tab | Click | Show Sales sub-menu | — |
| UI-DASH-003 | Purchase tab | Click | Show Purchase sub-menu | — |
| UI-DASH-004 | Report tab | Click | Show Report sub-menu | — |
| UI-DASH-005 | Contact sub-menu | Click | Navigate to /contacts | — |
| UI-DASH-006 | Product sub-menu | Click | Navigate to /products | — |
| UI-DASH-007 | Sales Order sub-menu | Click | Navigate to /sales-orders | — |
| UI-DASH-008 | Sale Invoice sub-menu | Click | Navigate to /invoices | — |
| UI-DASH-009 | Purchase Order sub-menu | Click | Navigate to /purchase-orders | — |
| UI-DASH-010 | Purchase Bill sub-menu | Click | Navigate to /bills | — |
| UI-DASH-011 | Balancesheet sub-menu | Click | Navigate to /reports/balance-sheet | — |
| UI-DASH-012 | Profit and Loss sub-menu | Click | Navigate to /reports/profit-and-loss | — |
| UI-DASH-013 | Sales Kanban cards | View | Display correct counts | — |
| UI-DASH-014 | Purchase Kanban cards | View | Display correct counts | — |
| UI-DASH-015 | Budget Kanban cards | View | Display correct counts | — |

---

## 4. Contact List Screen Tests

| Test ID | Control | Action | Expected | Pass |
|---------|---------|--------|----------|------|
| UI-CON-001 | Search input | Type keyword | Filter contacts | — |
| UI-CON-002 | List/Kanban toggle | Click | Switch view | — |
| UI-CON-003 | New button | Click | Navigate to /contacts/new | — |
| UI-CON-004 | Back button | Click | Navigate to /dashboard | — |
| UI-CON-005 | Contact row | Click | Navigate to /contacts/:id | — |
| UI-CON-006 | Pagination | Click page | Load page | — |
| UI-CON-007 | Empty list | View | Show "No contacts" message | — |

---

## 5. Contact Form Screen Tests

| Test ID | Control | Action | Expected | Pass |
|---------|---------|--------|----------|------|
| UI-CON-F-001 | Name input | Type name | Input accepted | — |
| UI-CON-F-002 | Email input | Type valid email | Input accepted | — |
| UI-CON-F-003 | Email input | Type duplicate email | Validation error | — |
| UI-CON-F-004 | Phone input | Type phone | Input accepted | — |
| UI-CON-F-005 | Image upload | Select image | Image uploaded | — |
| UI-CON-F-006 | Address fields | Type address | Input accepted | — |
| UI-CON-F-007 | Confirm button | Click (new) | Create contact, navigate to /contacts | — |
| UI-CON-F-008 | Confirm button | Click (edit) | Update contact, navigate to /contacts | — |
| UI-CON-F-009 | Back button | Click | Navigate to /contacts | — |
| UI-CON-F-010 | New button | Click | Clear form | — |

---

## 6. Invoice Form Screen Tests

| Test ID | Control | Action | Expected | Pass |
|---------|---------|--------|----------|------|
| UI-INV-001 | Customer dropdown | Select customer | Set customer | — |
| UI-INV-002 | Invoice date | Select date | Set date | — |
| UI-INV-003 | Due date | Select date | Set date | — |
| UI-INV-004 | Add line button | Click | Add line row | — |
| UI-INV-005 | Line product | Select product | Set product, price | — |
| UI-INV-006 | Line qty | Enter quantity | Calculate total | — |
| UI-INV-007 | Line unit price | Enter price | Calculate total | — |
| UI-INV-008 | Remove line | Click | Remove line row | — |
| UI-INV-009 | Confirm button | Click (draft) | Confirm, create JE | — |
| UI-INV-010 | Confirm button | Click (confirmed) | Button disabled | — |
| UI-INV-011 | Cancel button | Click (draft) | Cancel, navigate to /invoices | — |
| UI-INV-012 | Pay button | Click (confirmed, amount_due > 0) | Navigate to /invoices/:id/pay | — |
| UI-INV-013 | Print button | Click | Download PDF | — |
| UI-INV-014 | Send button | Click | Send email | — |
| UI-INV-015 | Back button | Click | Navigate to /invoices | — |
| UI-INV-016 | Browser refresh | Refresh on form | Reload form with data | — |

---

## 7. Invoice Payment Screen Tests

| Test ID | Control | Action | Expected | Pass |
|---------|---------|--------|----------|------|
| UI-INV-PAY-001 | Total display | View | Show correct total | — |
| UI-INV-PAY-002 | Amount due display | View | Show correct amount due | — |
| UI-INV-PAY-003 | Paid via dropdown | Select | Set payment method | — |
| UI-INV-PAY-004 | Amount input | Enter valid amount | Input accepted | — |
| UI-INV-PAY-005 | Amount input | Enter > amount_due | Validation error | — |
| UI-INV-PAY-006 | Amount input | Enter <= 0 | Validation error | — |
| UI-INV-PAY-007 | Pay button | Click (valid) | Process payment, navigate to /invoices/:id | — |
| UI-INV-PAY-008 | Back button | Click | Navigate to /invoices/:id | — |

---

## 8. Responsive Layout Tests

| Test ID | Viewport | Test | Expected | Pass |
|---------|----------|------|----------|------|
| UI-RESP-001 | Desktop (>1024px) | View layout | Full layout visible | — |
| UI-RESP-002 | Tablet (768-1024px) | View layout | Adjusted layout | — |
| UI-RESP-003 | Mobile (<768px) | View layout | Stacked layout | — |
| UI-RESP-004 | Desktop | Table overflow | Horizontal scroll | — |
| UI-RESP-005 | Mobile | Form layout | Fields stacked | — |
| UI-RESP-006 | Mobile | Navigation | Hamburger menu | — |

---

## 9. Visual QA Tests

| Test ID | Test | Expected | Pass |
|---------|------|----------|------|
| UI-VIS-001 | Button alignment | Consistent alignment | — |
| UI-VIS-002 | Form field labels | Aligned, no clipping | — |
| UI-VIS-003 | Error messages | Positioned below fields | — |
| UI-VIS-004 | Loading indicators | Visible during API calls | — |
| UI-VIS-005 | Empty states | Appropriate messages | — |
| UI-VIS-006 | Table headers | Aligned with data | — |
| UI-VIS-007 | Modal alignment | Centered on screen | — |
| UI-VIS-008 | Color consistency | Consistent theme | — |

---

*Document generated from UI control test analysis on 2026-09-05*
