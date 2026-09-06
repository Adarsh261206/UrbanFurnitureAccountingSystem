import { PdfDoc, buildPdf, money, PAGE, COLORS, type PdfColumn, type PdfRow } from './pdfService';

export interface ReportSection {
  title: string;
  items: { account_name: string; amount: number }[];
  total: number;
}

export interface ProfitLossData {
  year: number;
  income: ReportSection;
  expenses: ReportSection;
  net_income: number;
}

export interface BalanceSheetData {
  year: number;
  assets: ReportSection;
  liabilities: ReportSection;
  balance_check: boolean;
}

export interface TrialBalanceData {
  year: number;
  accounts: { account_id: string; account_name: string; account_type: string; debit: number; credit: number }[];
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
}

export interface CashFlowData {
  year: number;
  operating: { items: { description: string; amount: number }[]; total: number };
  investing: { items: { description: string; amount: number }[]; total: number };
  financing: { items: { description: string; amount: number }[]; total: number };
  net_change: number;
  opening_balance: number;
  closing_balance: number;
}

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

export interface Gstr1Data {
  period: string;
  summary: { total_taxable_value: number; total_igst: number; total_cgst: number; total_sgst: number; total_invoices: number };
  invoices: Gstr1Invoice[];
  hsn_summary: Gstr1HsnItem[];
}

export interface Gstr3bData {
  period: string;
  '3_1': { taxable_outward: number; zero_rated: number; deemed_exports: number; reverse_charge: number; total_outward: number };
  '3_2': { inter_state: number; intra_state: number };
  '4': { total_igst: number; total_cgst: number; total_sgst: number; total_cess: number };
  '5': { eligible_itc_igst: number; eligible_itc_cgst: number; eligible_itc_sgst: number; ineligible_itc: number };
  '6': { tax_payable_igst: number; tax_payable_cgst: number; tax_payable_sgst: number; interest: number; late_fee: number; total_tax_payable: number };
}

const REPORT_COLUMNS: PdfColumn[] = [
  { header: 'Account', width: 380 },
  { header: 'Amount', width: 120, align: 'right' },
];

function drawReportHeader(pdf: PdfDoc, title: string, subtitle: string): void {
  const { doc } = pdf;
  doc.rect(0, 0, PAGE.width, 96).fillColor(COLORS.brand).fill();
  doc.rect(PAGE.margin, 24, 34, 34).fillColor('#FFFFFF').fill();
  doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.brand).text('UF', PAGE.margin + 9, 34);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#FFFFFF').text('Urban Furniture', PAGE.margin + 46, 27);
  doc.font('Helvetica').fontSize(9).fillColor('#E8D5E3').text('Accounting System', PAGE.margin + 46, 47);
  doc.font('Helvetica-Bold').fontSize(18).fillColor('#FFFFFF').text(title, PAGE.margin, 24, { width: PAGE.contentWidth, align: 'right' });
  doc.font('Helvetica').fontSize(9).fillColor('#E8D5E3').text(subtitle, PAGE.margin, 50, { width: PAGE.contentWidth, align: 'right' });
  doc.rect(PAGE.margin, 78, PAGE.contentWidth, 2).fillColor('#FFFFFF').fill();
  pdf.y = 112;
}

function renderSection(pdf: PdfDoc, title: string, section: ReportSection): void {
  pdf.section(title);
  const rows: PdfRow[] = section.items.map((i) => ({
    cells: [i.account_name, money(i.amount)],
  }));
  rows.push({ cells: [`Total ${title}`, money(section.total)], total: true });
  pdf.table(REPORT_COLUMNS, rows);
}

export function generateProfitLossPdf(data: ProfitLossData): Promise<Buffer> {
  return buildPdf((pdf) => {
    drawReportHeader(pdf, 'PROFIT AND LOSS', `For the financial year ${data.year}`);

    renderSection(pdf, 'Income', data.income);
    pdf.y += 8;
    renderSection(pdf, 'Expenses', data.expenses);

    pdf.y += 10;
    pdf.summary(
      [
        {
          label: data.net_income >= 0 ? 'Net Income' : 'Net Loss',
          value: money(data.net_income),
          highlight: true,
        },
      ],
      { spaceAfter: 0 },
    );
  });
}

export function generateBalanceSheetPdf(data: BalanceSheetData): Promise<Buffer> {
  return buildPdf((pdf) => {
    drawReportHeader(pdf, 'BALANCE SHEET', `As at financial year ${data.year}`);

    renderSection(pdf, 'Assets', data.assets);
    pdf.y += 8;
    renderSection(pdf, 'Liabilities', data.liabilities);

    pdf.y += 10;
    pdf.summary(
      [
        {
          label: 'Balance Check',
          value: data.balance_check ? 'BALANCED' : 'NOT BALANCED',
          highlight: true,
        },
      ],
      { spaceAfter: 0 },
    );
  });
}

const TRIAL_BALANCE_COLUMNS: PdfColumn[] = [
  { header: 'Account', width: 260 },
  { header: 'Type', width: 100 },
  { header: 'Debit', width: 120, align: 'right' },
  { header: 'Credit', width: 120, align: 'right' },
];

const CASH_FLOW_COLUMNS: PdfColumn[] = [
  { header: 'Description', width: 380 },
  { header: 'Amount', width: 120, align: 'right' },
];

export function generateTrialBalancePdf(data: TrialBalanceData): Promise<Buffer> {
  return buildPdf((pdf) => {
    drawReportHeader(pdf, 'TRIAL BALANCE', `As at financial year ${data.year}`);

    const rows: PdfRow[] = data.accounts.map((a) => ({
      cells: [a.account_name, a.account_type, money(a.debit), money(a.credit)],
    }));

    rows.push({
      cells: ['Total', '', money(data.total_debit), money(data.total_credit)],
      total: true,
    });

    pdf.table(TRIAL_BALANCE_COLUMNS, rows);

    pdf.y += 10;
    pdf.summary(
      [
        {
          label: 'Status',
          value: data.is_balanced ? 'BALANCED' : 'NOT BALANCED',
          highlight: true,
        },
      ],
      { spaceAfter: 0 },
    );
  });
}

function renderCashFlowSection(pdf: PdfDoc, title: string, items: { description: string; amount: number }[], total: number): void {
  pdf.section(title);
  const rows: PdfRow[] = items.map((i) => ({
    cells: [i.description, money(i.amount)],
  }));
  rows.push({ cells: [`Total ${title}`, money(total)], total: true });
  pdf.table(CASH_FLOW_COLUMNS, rows);
}

export function generateCashFlowPdf(data: CashFlowData): Promise<Buffer> {
  return buildPdf((pdf) => {
    drawReportHeader(pdf, 'CASH FLOW STATEMENT', `For the financial year ${data.year}`);

    renderCashFlowSection(pdf, 'Operating Activities', data.operating.items, data.operating.total);
    pdf.y += 8;
    renderCashFlowSection(pdf, 'Investing Activities', data.investing.items, data.investing.total);
    pdf.y += 8;
    renderCashFlowSection(pdf, 'Financing Activities', data.financing.items, data.financing.total);

    pdf.y += 10;
    pdf.summary(
      [
        { label: 'Opening Balance', value: money(data.opening_balance), highlight: false },
        { label: 'Net Change', value: money(data.net_change), highlight: true },
        { label: 'Closing Balance', value: money(data.closing_balance), highlight: true },
      ],
      { spaceAfter: 0 },
    );
  });
}

const GSTR1_INVOICE_COLUMNS: PdfColumn[] = [
  { header: 'Invoice No', width: 90 },
  { header: 'Date', width: 65 },
  { header: 'Customer', width: 100 },
  { header: 'GSTIN', width: 90 },
  { header: 'Taxable', width: 65, align: 'right' },
  { header: 'IGST', width: 55, align: 'right' },
  { header: 'CGST', width: 55, align: 'right' },
  { header: 'SGST', width: 55, align: 'right' },
  { header: 'Total', width: 65, align: 'right' },
];

const GSTR1_HSN_COLUMNS: PdfColumn[] = [
  { header: 'HSN Code', width: 70 },
  { header: 'Description', width: 120 },
  { header: 'UQC', width: 45 },
  { header: 'Qty', width: 50, align: 'right' },
  { header: 'Value', width: 70, align: 'right' },
  { header: 'Taxable', width: 70, align: 'right' },
  { header: 'IGST', width: 60, align: 'right' },
  { header: 'CGST', width: 60, align: 'right' },
  { header: 'SGST', width: 60, align: 'right' },
];

const GSTR3B_COLUMNS: PdfColumn[] = [
  { header: 'Description', width: 340 },
  { header: 'Amount', width: 160, align: 'right' },
];

export function generateGstr1Pdf(data: Gstr1Data): Promise<Buffer> {
  return buildPdf((pdf) => {
    drawReportHeader(pdf, 'GSTR-1 — OUTWARD SUPPLIES', `Period: ${data.period}`);

    pdf.section('Summary');
    pdf.table(
      [
        { header: 'Metric', width: 300 },
        { header: 'Value', width: 200, align: 'right' },
      ],
      [
        { cells: ['Total Invoices', String(data.summary.total_invoices)] },
        { cells: ['Total Taxable Value', money(data.summary.total_taxable_value)] },
        { cells: ['Total IGST', money(data.summary.total_igst)] },
        { cells: ['Total CGST', money(data.summary.total_cgst)] },
        { cells: ['Total SGST', money(data.summary.total_sgst)] },
      ],
    );

    pdf.y += 6;
    pdf.section('Invoice Details');
    const invRows: PdfRow[] = data.invoices.map((inv) => ({
      cells: [
        inv.invoice_number,
        inv.date,
        inv.customer_name,
        inv.customer_gstin || '—',
        money(inv.taxable_value),
        money(inv.igst),
        money(inv.cgst),
        money(inv.sgst),
        money(inv.total),
      ],
    }));
    invRows.push({
      cells: [
        'Total',
        '',
        '',
        '',
        money(data.summary.total_taxable_value),
        money(data.summary.total_igst),
        money(data.summary.total_cgst),
        money(data.summary.total_sgst),
        money(data.invoices.reduce((s, i) => s + i.total, 0)),
      ],
      total: true,
    });
    pdf.table(GSTR1_INVOICE_COLUMNS, invRows);

    pdf.y += 6;
    pdf.section('HSN Summary');
    const hsnRows: PdfRow[] = data.hsn_summary.map((h) => ({
      cells: [
        h.hsn_code,
        h.description,
        h.uqc,
        String(h.total_quantity),
        money(h.total_value),
        money(h.taxable_value),
        money(h.igst),
        money(h.cgst),
        money(h.sgst),
      ],
    }));
    pdf.table(GSTR1_HSN_COLUMNS, hsnRows);
  });
}

export function generateGstr3bPdf(data: Gstr3bData): Promise<Buffer> {
  return buildPdf((pdf) => {
    drawReportHeader(pdf, 'GSTR-3B — SUMMARY RETURN', `Period: ${data.period}`);

    pdf.section('3.1 — Outward Supplies');
    pdf.table(GSTR3B_COLUMNS, [
      { cells: ['Taxable outward supplies', money(data['3_1'].taxable_outward)] },
      { cells: ['Zero rated supplies', money(data['3_1'].zero_rated)] },
      { cells: ['Deemed exports', money(data['3_1'].deemed_exports)] },
      { cells: ['Reverse charge', money(data['3_1'].reverse_charge)] },
      { cells: ['Total outward supplies', money(data['3_1'].total_outward)], total: true },
    ]);

    pdf.y += 4;
    pdf.section('3.2 — Interstate/Intrastate Supplies');
    pdf.table(GSTR3B_COLUMNS, [
      { cells: ['Inter-state supplies', money(data['3_2'].inter_state)] },
      { cells: ['Intra-state supplies', money(data['3_2'].intra_state)] },
    ]);

    pdf.y += 4;
    pdf.section('4 — Tax Liability');
    pdf.table(GSTR3B_COLUMNS, [
      { cells: ['IGST', money(data['4'].total_igst)] },
      { cells: ['CGST', money(data['4'].total_cgst)] },
      { cells: ['SGST', money(data['4'].total_sgst)] },
      { cells: ['Cess', money(data['4'].total_cess)] },
      { cells: ['Total Tax Liability', money(data['4'].total_igst + data['4'].total_cgst + data['4'].total_sgst + data['4'].total_cess)], total: true },
    ]);

    pdf.y += 4;
    pdf.section('5 — Input Tax Credit');
    pdf.table(GSTR3B_COLUMNS, [
      { cells: ['Eligible ITC — IGST', money(data['5'].eligible_itc_igst)] },
      { cells: ['Eligible ITC — CGST', money(data['5'].eligible_itc_cgst)] },
      { cells: ['Eligible ITC — SGST', money(data['5'].eligible_itc_sgst)] },
      { cells: ['Ineligible ITC', money(data['5'].ineligible_itc)] },
      { cells: ['Total Eligible ITC', money(data['5'].eligible_itc_igst + data['5'].eligible_itc_cgst + data['5'].eligible_itc_sgst)], total: true },
    ]);

    pdf.y += 4;
    pdf.section('6 — Payment of Tax');
    pdf.table(GSTR3B_COLUMNS, [
      { cells: ['Tax payable — IGST', money(data['6'].tax_payable_igst)] },
      { cells: ['Tax payable — CGST', money(data['6'].tax_payable_cgst)] },
      { cells: ['Tax payable — SGST', money(data['6'].tax_payable_sgst)] },
      { cells: ['Interest', money(data['6'].interest)] },
      { cells: ['Late fee', money(data['6'].late_fee)] },
      { cells: ['Total Tax Payable', money(data['6'].total_tax_payable)], total: true },
    ]);
  });
}