import { PdfDoc, buildPdf, money, PAGE, COLORS, type PdfColumn } from './pdfService';
import { generateBarcodePng } from './barcodeService';

interface DocumentModel {
  document_no: string;
  reference: string | null;
  party: { name: string; gstin?: string | null } | null;
  document_date: string;
  due_date: string | null;
  payment_type: string | null;
  payment_via: string | null;
  status: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  amount_due: number;
  notes?: string | null;
  lines: {
    sr_no: number;
    product_name: string | null;
    qty: number;
    unit_price: number;
    tax_rate: number;
    total: number;
  }[];
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const DOC_COLUMNS: PdfColumn[] = [
  { header: '#', width: 28, align: 'center' },
  { header: 'Product', width: 200 },
  { header: 'Qty', width: 56, align: 'right' },
  { header: 'Unit Price', width: 100, align: 'right' },
  { header: 'Amount', width: 115, align: 'right' },
];

function drawDocumentHeader(pdf: PdfDoc, docType: 'INVOICE' | 'BILL', document: DocumentModel): void {
  const { doc } = pdf;

  // Brand band
  doc
    .rect(0, 0, PAGE.width, 96)
    .fillColor(COLORS.dark)
    .fill();

  // Logo mark
  doc
    .rect(PAGE.margin, 24, 34, 34)
    .fillColor(COLORS.brand)
    .fill();
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(COLORS.lightText)
    .text('UF', PAGE.margin + 9, 34);

  // Company
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor(COLORS.lightText)
    .text('Urban Furniture', PAGE.margin + 46, 27);
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORS.headerSub)
    .text('Accounting System', PAGE.margin + 46, 47);

  // Document title (right)
  doc
    .font('Helvetica-Bold')
    .fontSize(18)
    .fillColor(COLORS.brand)
    .text(
      docType === 'INVOICE' ? 'CUSTOMER INVOICE' : 'VENDOR BILL',
      PAGE.margin,
      24,
      { width: PAGE.contentWidth, align: 'right' },
    );
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORS.headerSub)
    .text(document.document_no, PAGE.margin, 50, { width: PAGE.contentWidth, align: 'right' });

  // Accent line
  doc.rect(PAGE.margin, 78, PAGE.contentWidth, 2).fillColor(COLORS.brand).fill();

  pdf.y = 112;
}

function buildDocumentPdf(docType: 'INVOICE' | 'BILL', doc: DocumentModel, _generatedAt: Date): Promise<Buffer> {
  return buildPdf(async (pdf) => {
    drawDocumentHeader(pdf, docType, doc);

    const partyLabel = docType === 'INVOICE' ? 'Bill To' : 'Vendor';
    const refLabel = docType === 'INVOICE' ? 'Invoice Reference' : 'Vendor Bill No.';

    pdf.infoGrid([
      { label: docType === 'INVOICE' ? 'Invoice Number' : 'Bill Number', value: doc.document_no },
      { label: refLabel, value: doc.reference ?? '—' },
      { label: partyLabel, value: doc.party?.name ?? '—' },
      { label: 'Date', value: fmtDate(doc.document_date) },
      { label: 'Due Date', value: fmtDate(doc.due_date) },
      { label: 'Status', value: doc.status.replace(/_/g, ' ').toUpperCase() },
    ]);

    if (doc.party?.gstin) {
      pdf.section(`${docType === 'INVOICE' ? 'Customer' : 'Vendor'} GSTIN`);
      pdf.bodyText(doc.party.gstin);
      pdf.space(8);
    }

    pdf.section('Line Items');
    pdf.table(
      DOC_COLUMNS,
      doc.lines.map((l) => ({
        cells: [l.sr_no, l.product_name ?? '—', l.qty, money(l.unit_price), money(l.total)],
      })),
    );

    if (doc.tax_amount > 0) {
      pdf.summary([
        { label: 'Subtotal', value: money(doc.subtotal) },
        { label: 'Tax (GST)', value: money(doc.tax_amount) },
        { label: 'Total', value: money(doc.total), total: true },
        {
          label: 'Amount Due',
          value: money(doc.amount_due),
          highlight: true,
        },
        {
          label: 'Payment',
          value: `${(doc.payment_type ?? '—').toUpperCase()} / ${(doc.payment_via ?? '—').toUpperCase()}`,
        },
      ]);
    } else {
      pdf.summary([
        { label: 'Total', value: money(doc.total), total: true },
        {
          label: 'Amount Due',
          value: money(doc.amount_due),
          highlight: true,
        },
        {
          label: 'Payment',
          value: `${(doc.payment_type ?? '—').toUpperCase()} / ${(doc.payment_via ?? '—').toUpperCase()}`,
        },
      ]);
    }

    if (doc.notes) {
      pdf.space(10);
      pdf.section('Notes');
      pdf.bodyText(doc.notes);
    }

    // Barcode strip at the bottom of the last page content area
    pdf.space(14);
    const { doc: d } = pdf;
    const barcodeText = `${docType === 'INVOICE' ? 'INV' : 'BILL'}:${doc.document_no}`;
    try {
      const barcodePng = await generateBarcodePng(barcodeText);
      pdf.ensureSpace(70);
      d.image(barcodePng, PAGE.margin, pdf.y, { width: 180, height: 48 });
      d.font('Helvetica').fontSize(7).fillColor(COLORS.muted).text(
        `Scan to verify — ${barcodeText}`,
        PAGE.margin + 8,
        pdf.y + 52,
        { lineBreak: false },
      );
      pdf.y += 66;
    } catch {
      // Barcode generation should never break the PDF
    }
  });
}

export async function generateInvoicePdf(invoice: DocumentModel): Promise<Buffer> {
  return buildDocumentPdf('INVOICE', invoice, new Date());
}

export async function generateBillPdf(bill: DocumentModel): Promise<Buffer> {
  return buildDocumentPdf('BILL', bill, new Date());
}

export { money };