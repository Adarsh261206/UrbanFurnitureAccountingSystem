# 05 — Features

> **Project:** Urban Furniture Accounting Management System  
> **Document Version:** 2.0  
> **Source:** Excalidraw Annotations + Frozen Decisions  
> **Date:** 2026-09-05

---

## 1. Module Overview

| Module | Menu Label | Sub-items | Description |
|--------|-----------|-----------|-------------|
| Account | Account | Contact, Product, Analyticals, Analytical Budget, Chart of Account, Journals, Journal Entries | Master data and accounting setup |
| Sales | Sales | Sales Order, Sale Invoice, Receipt | Customer sales workflow |
| Purchase | Purchase | Purchase Order, Purchase Bill, Payment | Vendor purchase workflow |
| Report | Report | Balancesheet, Profit and Loss, Budget Report | Financial reporting |

## 2. Screen Inventory

| # | Screen Name | Source Reference | Classification |
|---|------------|-----------------|----------------|
| S01 | Create User | Excalidraw Screen 1 | SOURCE_REQUIRED |
| S02 | Login Page | Excalidraw Screen 2 | SOURCE_REQUIRED |
| S03 | Sign Up Page | Excalidraw Screen 2 | SOURCE_REQUIRED |
| S04 | Forgot Password | Excalidraw Screen 2 | SOURCE_REQUIRED |
| S05 | App Dashboard | Excalidraw Screen 3 | SOURCE_REQUIRED |
| S06 | Contact List View | Excalidraw Screen 4 | SOURCE_REQUIRED |
| S07 | Contact Kanban View | Excalidraw Screen 4 | SOURCE_REQUIRED |
| S08 | Contact Master Form View | Excalidraw Screen 4 | SOURCE_REQUIRED |
| S09 | Product Master List View | Excalidraw Screen 5 | SOURCE_REQUIRED |
| S10 | Product Master Kanban View | Excalidraw Screen 5 | SOURCE_REQUIRED |
| S11 | Product Master Form View | Excalidraw Screen 5 | SOURCE_REQUIRED |
| S12 | Analyticals Form View | Excalidraw Screen 8 | SOURCE_REQUIRED |
| S13 | Analytical Budget Form View | Excalidraw Screen 8 | SOURCE_REQUIRED |
| S14 | Chart of Accounts List View | Excalidraw Screen 6 | SOURCE_REQUIRED |
| S15 | Chart of Account Form View | Excalidraw Screen 6 | SOURCE_REQUIRED |
| S16 | Journals List View | Excalidraw Screen 6 | SOURCE_REQUIRED |
| S17 | Journal Entry Form View | Excalidraw Screen 6 | SOURCE_REQUIRED |
| S18 | Journal Entries List View | Excalidraw Screen 6 | SOURCE_REQUIRED |
| S19 | Budget Report List View | Excalidraw Screen 8 | SOURCE_REQUIRED |
| S20 | Budget Report Kanban View | Excalidraw Screen 8 | SOURCE_REQUIRED |
| S21 | Budget Form View (Original) | Excalidraw Screen 8 | SOURCE_REQUIRED |
| S22 | Budget Form View (Revised) | Excalidraw Screen 8 | SOURCE_REQUIRED |
| S23 | Sales Order Form View | Excalidraw Screen 12 | SOURCE_REQUIRED |
| S24 | Customer Invoice Form View | Excalidraw Screen 12 | SOURCE_REQUIRED |
| S25 | Customer Invoice Payment View | Excalidraw Screen 13 | SOURCE_REQUIRED |
| S26 | Purchase Order Form View | Excalidraw Screen 10 | SOURCE_REQUIRED |
| S27 | Vendor Bill Form View | Excalidraw Screen 10 | SOURCE_REQUIRED |
| S28 | Vendor Bill Payment View | Excalidraw Screen 11 | SOURCE_REQUIRED |
| S29 | Sales Kanban View | Excalidraw Screen 12 | SOURCE_REQUIRED |
| S30 | Purchase Kanban View | Excalidraw Screen 10 | SOURCE_REQUIRED |
| S31 | P&L Report View | Excalidraw Screen 14 | SOURCE_REQUIRED |
| S32 | Balance Sheet Report View | Excalidraw Screen 15 | SOURCE_REQUIRED |
| S33 | Budget Report View | Excalidraw Screen 16 | SOURCE_REQUIRED |

## 3. Feature Details

### 3.1 Authentication Features

| Feature | Screen | Description | Frozen Decision |
|---------|--------|-------------|-----------------|
| Sign Up | S03 | Create invoicing user | Role = user |
| Login | S02 | Authenticate user | HttpOnly cookie |
| Forgot Password | S04 | Reset password | Deferred |
| Create User | S01 | Admin creates users | Admin only |

### 3.2 Contact Features

| Feature | Screen | Description | Frozen Decision |
|---------|--------|-------------|-----------------|
| List Contacts | S06 | View all contacts | Server pagination |
| Kanban Contacts | S07 | Card view | Toggle |
| Create Contact | S08 | New contact form | Email unique |
| Edit Contact | S08 | Update contact | RBAC enforced |

### 3.3 Product Features

| Feature | Screen | Description | Frozen Decision |
|---------|--------|-------------|-----------------|
| List Products | S09 | View all products | Server pagination |
| Kanban Products | S10 | Card view | Toggle |
| Create Product | S11 | New product form | Category on-the-fly |
| Edit Product | S11 | Update product | Price >= 0 |

### 3.4 Budget Features

| Feature | Screen | Description | Frozen Decision |
|---------|--------|-------------|-----------------|
| List Budgets | S19 | View all budgets | Server pagination |
| Kanban Budgets | S20 | Card view | Toggle |
| Create Budget | S21 | New budget form | User-entered committed |
| Confirm Budget | S21 | Set committed amount | User-entered |
| Revise Budget | S22 | Create revision | New budget linked |
| Cancel Budget | S21 | Archive budget | is_archived = true |

### 3.5 Sales Features

| Feature | Screen | Description | Frozen Decision |
|---------|--------|-------------|-----------------|
| List SO | S23 | View all sales orders | Server pagination |
| Create SO | S23 | New SO form | Auto SO number |
| List Invoices | S24 | View all invoices | Server pagination |
| Create Invoice | S24 | New invoice form | Auto INV reference |
| Confirm Invoice | S24 | Confirm draft | Creates JE |
| Pay Invoice | S25 | Process payment | Reduces amount_due |
| Print Invoice | S24 | Download PDF | PDF generation |

### 3.6 Purchase Features

| Feature | Screen | Description | Frozen Decision |
|---------|--------|-------------|-----------------|
| List PO | S26 | View all purchase orders | Server pagination |
| Create PO | S26 | New PO form | Auto PO number |
| List Bills | S27 | View all bills | Server pagination |
| Create Bill | S27 | New bill form | Auto Bill reference |
| Confirm Bill | S27 | Confirm draft | Creates JE |
| Pay Bill | S28 | Process payment | Reduces amount_due |
| Print Bill | S27 | Download PDF | PDF generation |

### 3.7 Report Features

| Feature | Screen | Description | Frozen Decision |
|---------|--------|-------------|-----------------|
| P&L Report | S31 | Income statement | Year filter |
| Balance Sheet | S32 | Financial position | Year filter, balanced |
| Budget Report | S33 | Achievement report | Computed achievement |

---

*Document generated from Excalidraw annotations + frozen decisions on 2026-09-05*
