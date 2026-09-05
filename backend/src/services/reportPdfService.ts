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

const REPORT_COLUMNS: PdfColumn[] = [
  { header: 'Account', width: 380 },
  { header: 'Amount', width: 120, align: 'right' },
];

function drawReportHeader(pdf: PdfDoc, title: string, subtitle: string): void {
  const { doc } = pdf;
  doc.rect(0, 0, PAGE.width, 96).fillColor(COLORS.dark).fill();
  doc.rect(PAGE.margin, 24, 34, 34).fillColor(COLORS.brand).fill();
  doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.lightText).text('UF', PAGE.margin + 9, 34);
  doc.font('Helvetica-Bold').fontSize(14).fillColor(COLORS.lightText).text('Urban Furniture', PAGE.margin + 46, 27);
  doc.font('Helvetica').fontSize(9).fillColor(COLORS.headerSub).text('Accounting System', PAGE.margin + 46, 47);
  doc.font('Helvetica-Bold').fontSize(18).fillColor(COLORS.brand).text(title, PAGE.margin, 24, { width: PAGE.contentWidth, align: 'right' });
  doc.font('Helvetica').fontSize(9).fillColor(COLORS.headerSub).text(subtitle, PAGE.margin, 50, { width: PAGE.contentWidth, align: 'right' });
  doc.rect(PAGE.margin, 78, PAGE.contentWidth, 2).fillColor(COLORS.brand).fill();
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