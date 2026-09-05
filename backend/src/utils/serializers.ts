// API serializers — maps Prisma models to the documented API contract (CR-006: API snake_case).
// Frontend types in src/types/api.ts are the canonical shapes.

function iso(d: Date | string | null | undefined): string {
  if (!d) return d as any;
  return new Date(d).toISOString();
}

function dateOnly(d: Date | string | null | undefined): string {
  if (!d) return d as any;
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function num(v: unknown): number {
  return Number(v) || 0;
}

export function serializeUser(u: any): any {
  return {
    id: u.id,
    name: u.name,
    login_id: u.loginId,
    email: u.email,
    role: u.role,
    is_active: u.isActive,
    approval_status: u.approvalStatus ?? 'approved',
    created_at: u.createdAt ? iso(u.createdAt) : undefined,
  };
}

export function serializeContact(c: any): any {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone ?? null,
    image_url: c.imageUrl ?? null,
    street: c.street ?? null,
    city: c.city ?? null,
    state: c.state ?? null,
    country: c.country ?? null,
    pincode: c.pincode ?? null,
    contact_type: c.contactType ?? 'both',
    gstin: c.gstin ?? null,
    pan: c.pan ?? null,
    created_at: iso(c.createdAt),
  };
}

export function serializeCategory(c: any): any {
  return { id: c.id, name: c.name };
}

export function serializeProduct(p: any): any {
  return {
    id: p.id,
    name: p.name,
    category_id: p.categoryId,
    category_name: p.category?.name ?? null,
    brand_id: p.brandId ?? null,
    brand_name: p.brand?.name ?? null,
    product_type: p.productType,
    sku: p.sku ?? null,
    barcode: p.barcode ?? null,
    hsn_code: p.hsnCode ?? null,
    description: p.description ?? null,
    is_active: p.isActive ?? true,
    sales_price: num(p.salesPrice),
    cost: num(p.cost),
    image_url: p.imageUrl ?? null,
    images: (p.images ?? []).map((i: any) => ({
      id: i.id,
      image_url: i.imageUrl,
      sort_order: i.sortOrder,
    })),
    created_at: iso(p.createdAt),
  };
}

export function serializeBrand(b: any): any {
  return {
    id: b.id,
    name: b.name,
    product_count: b._count?.products ?? undefined,
    created_at: iso(b.createdAt),
  };
}

export function serializeAnalytical(a: any): any {
  return {
    id: a.id,
    name: a.name,
    responsible_id: a.responsibleId,
    start_date: dateOnly(a.startDate),
    to_date: dateOnly(a.toDate),
    end_date: dateOnly(a.endDate),
    analytic_account: a.analyticAccount,
  };
}

export function serializeChartOfAccount(c: any): any {
  return {
    id: c.id,
    name: c.name,
    account_type: c.accountType,
    journal_type: c.journalType ?? null,
  };
}

export function serializeJournal(j: any): any {
  return {
    id: j.id,
    name: j.name,
    journal_type: j.journalType,
    default_account_id: j.defaultAccountId,
  };
}

export function serializeJournalEntryRow(e: any): any {
  return {
    id: e.id,
    entry_number: e.entryNumber,
    journal_id: e.journalId,
    journal_name: e.journal?.name ?? null,
    accounting_date: dateOnly(e.accountingDate),
    reference: e.sourceDocumentType ? `${e.sourceDocumentType}:${e.sourceDocumentId ?? ''}` : null,
    status: e.status,
    created_at: iso(e.createdAt),
  };
}

export function serializeJournalEntryLine(l: any): any {
  return {
    id: l.id,
    account_id: l.accountId,
    partner_id: l.partnerId ?? null,
    debit: num(l.debit),
    credit: num(l.credit),
  };
}

export function serializeJournalEntryDetail(e: any): any {
  return {
    ...serializeJournalEntryRow(e),
    lines: (e.lines ?? []).map(serializeJournalEntryLine),
  };
}

export function serializeSalesOrderRow(o: any): any {
  return {
    id: o.id,
    so_number: o.soNumber,
    customer_id: o.customerId,
    customer_name: o.customer?.name ?? null,
    order_date: dateOnly(o.date),
    status: o.status,
    total_amount: num(o.total),
    created_at: iso(o.createdAt),
  };
}

export function serializePurchaseOrderRow(o: any): any {
  return {
    id: o.id,
    po_number: o.poNumber,
    vendor_id: o.vendorId,
    vendor_name: o.vendor?.name ?? null,
    order_date: dateOnly(o.date),
    status: o.status,
    total_amount: num(o.total),
    created_at: iso(o.createdAt),
  };
}

export function serializePurchaseOrderLine(l: any): any {
  return {
    id: l.id,
    sr_no: l.srNo,
    product_id: l.productId,
    product_name: l.product?.name ?? null,
    chart_of_account_id: l.chartOfAccountId,
    budget_analytic_id: l.budgetAnalyticId ?? null,
    qty: num(l.qty),
    unit_price: num(l.unitPrice),
    total: num(l.total),
  };
}

export function serializePurchaseOrderDetail(o: any): any {
  return {
    ...serializePurchaseOrderRow(o),
    vendor: o.vendor ? { id: o.vendor.id, name: o.vendor.name } : null,
    lines: (o.purchaseOrderLines ?? o.lines ?? []).map(serializePurchaseOrderLine),
  };
}

export function serializeSalesOrderDetail(o: any): any {
  return {
    ...serializeSalesOrderRow(o),
    customer: o.customer ? { id: o.customer.id, name: o.customer.name } : null,
    lines: (o.salesOrderLines ?? o.lines ?? []).map(serializePurchaseOrderLine),
  };
}

export function serializeInvoiceLine(l: any): any {
  return {
    id: l.id,
    sr_no: l.srNo,
    product_id: l.productId,
    product_name: l.product?.name ?? null,
    chart_of_account_id: l.chartOfAccountId,
    budget_analytic_id: l.budgetAnalyticId ?? null,
    qty: num(l.qty),
    unit_price: num(l.unitPrice),
    tax_rate: num(l.taxRate),
    tax_amount: num(l.qty) * num(l.unitPrice) * (num(l.taxRate) / 100),
    total: num(l.total),
  };
}

export function serializeInvoiceListRow(i: any): any {
  return {
    id: i.id,
    invoice_reference: i.invoiceReference,
    invoice_number: i.invoiceNumber,
    customer_id: i.customerId,
    customer_name: i.customer?.name ?? null,
    invoice_date: dateOnly(i.invoiceDate),
    due_date: dateOnly(i.dueDate),
    status: i.status,
    total_amount: num(i.total),
    amount_paid: num(i.total) - num(i.amountDue),
    amount_due: num(i.amountDue),
    sales_order_id: i.salesOrderId ?? null,
    journal_entry_id: i.journalEntryId ?? null,
    created_at: iso(i.createdAt),
  };
}

export function serializeInvoiceDetail(i: any): any {
  return {
    id: i.id,
    invoice_reference: i.invoiceReference,
    invoice_number: i.invoiceNumber,
    sales_order_id: i.salesOrderId ?? null,
    customer: i.customer ? { id: i.customer.id, name: i.customer.name, gstin: i.customer.gstin ?? null } : null,
    date: dateOnly(i.date),
    invoice_date: dateOnly(i.invoiceDate),
    due_date: dateOnly(i.dueDate),
    payment_type: i.paymentType,
    partner: i.partner ? { id: i.partner.id, name: i.partner.name } : null,
    payment_via: i.paymentVia,
    subtotal: num(i.subtotal),
    tax_amount: num(i.taxAmount),
    total: num(i.total),
    amount_due: num(i.amountDue),
    notes: i.notes ?? null,
    status: i.status,
    journal_entry_id: i.journalEntryId ?? null,
    lines: (i.invoiceLines ?? i.lines ?? []).map(serializeInvoiceLine),
    created_at: iso(i.createdAt),
  };
}

export function serializeBillLine(l: any): any {
  return {
    id: l.id,
    sr_no: l.srNo,
    product_id: l.productId,
    product_name: l.product?.name ?? null,
    chart_of_account_id: l.chartOfAccountId,
    budget_analytic_id: l.budgetAnalyticId ?? null,
    qty: num(l.qty),
    unit_price: num(l.unitPrice),
    tax_rate: num(l.taxRate),
    tax_amount: num(l.qty) * num(l.unitPrice) * (num(l.taxRate) / 100),
    total: num(l.total),
  };
}

export function serializeBillListRow(b: any): any {
  return {
    id: b.id,
    bill_reference: b.billReference,
    vendor_id: b.vendorId,
    vendor_name: b.vendor?.name ?? null,
    bill_date: dateOnly(b.billDate),
    due_date: dateOnly(b.dueDate),
    status: b.status,
    total_amount: num(b.total),
    amount_paid: num(b.total) - num(b.amountDue),
    amount_due: num(b.amountDue),
    purchase_order_id: b.purchaseOrderId ?? null,
    journal_entry_id: b.journalEntryId ?? null,
    created_at: iso(b.createdAt),
  };
}

export function serializeBillDetail(b: any): any {
  return {
    id: b.id,
    bill_reference: b.billReference,
    vendor_bill_no: b.vendorBillNo ?? null,
    purchase_order_id: b.purchaseOrderId ?? null,
    vendor: b.vendor ? { id: b.vendor.id, name: b.vendor.name, gstin: b.vendor.gstin ?? null } : null,
    date: dateOnly(b.date),
    bill_date: dateOnly(b.billDate),
    due_date: dateOnly(b.dueDate),
    payment_type: b.paymentType,
    partner: b.partner ? { id: b.partner.id, name: b.partner.name } : null,
    payment_via: b.paymentVia,
    subtotal: num(b.subtotal),
    tax_amount: num(b.taxAmount),
    total: num(b.total),
    amount_due: num(b.amountDue),
    notes: b.notes ?? null,
    status: b.status,
    journal_entry_id: b.journalEntryId ?? null,
    lines: (b.billLines ?? b.lines ?? []).map(serializeBillLine),
    created_at: iso(b.createdAt),
  };
}

export function serializePayment(p: any): any {
  return {
    id: p.id,
    payment_number: p.paymentNumber,
    invoice_id: p.invoiceId ?? null,
    vendor_bill_id: p.vendorBillId ?? null,
    amount: num(p.amount),
    payment_via: p.paymentVia,
    payment_date: dateOnly(p.paymentDate),
    status: p.status,
    created_at: iso(p.createdAt),
  };
}

export function serializeBudgetListRow(b: any): any {
  const committed = b.committedAmount !== null && b.committedAmount !== undefined ? num(b.committedAmount) : null;
  const achieved = num(b.achievedAmount);
  return {
    id: b.id,
    name: b.name,
    responsible: b.responsible?.name ?? null,
    start_date: dateOnly(b.startDate),
    end_date: dateOnly(b.endDate),
    type: b.type,
    committed_amount: committed,
    achieved_amount: achieved,
    achieved_percentage: committed ? Math.round((achieved / committed) * 100) : null,
    amount_to_achieve: committed ? committed - achieved : null,
    status: b.status,
    previous_budget_id: b.originalBudgetId ?? null,
    analytical_id: b.analyticalId,
    is_archived: b.isArchived,
    created_at: iso(b.createdAt),
  };
}

export function serializeBudgetDetail(b: any): any {
  const committed = b.committedAmount !== null && b.committedAmount !== undefined ? num(b.committedAmount) : null;
  const achieved = num(b.achievedAmount);
  return {
    id: b.id,
    name: b.name,
    responsible: b.responsible ? { id: b.responsible.id, name: b.responsible.name } : null,
    start_date: dateOnly(b.startDate),
    end_date: dateOnly(b.endDate),
    type: b.type,
    committed_amount: committed,
    achieved_amount: achieved,
    achieved_percentage: committed ? Math.round((achieved / committed) * 100) : null,
    amount_to_achieve: committed ? committed - achieved : null,
    status: b.status,
    previous_budget_id: b.originalBudgetId ?? null,
    analytical_id: b.analyticalId,
    is_archived: b.isArchived,
    created_at: iso(b.createdAt),
  };
}

export function serializeDashboard(d: any): any {
  return {
    sales: { draft: d.draftSalesOrders, confirmed: d.confirmedSalesOrders, total: d.totalSalesOrders },
    purchase: { draft: d.draftPurchaseOrders, confirmed: d.confirmedPurchaseOrders, total: d.totalPurchaseOrders },
    budgets: { draft: d.draftBudgets, confirmed: d.confirmedBudgets, total: d.totalBudgets },
  };
}