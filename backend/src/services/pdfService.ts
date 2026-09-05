import PDFDocument from 'pdfkit';

/**
 * Minimal PDF layout engine on top of pdfkit.
 *
 * Responsibilities:
 *  - text measurement (wrapped height) so rows never overlap
 *  - automatic page breaks when content exceeds the page
 *  - consistent document header/footer and table rendering
 */

export const PAGE = {
  width: 595.28, // A4 portrait
  height: 841.89,
  margin: 48,
  contentWidth: 595.28 - 48 * 2,
  // Footer sits just above the bottom margin so pdfkit never tries to
  // auto-paginate it.
  footerY: 841.89 - 48 - 14,
};

export const COLORS = {
  brand: '#017E84',
  brandDark: '#015E63',
  dark: '#1F2530',
  text: '#212529',
  muted: '#6C757D',
  lightText: '#FFFFFF',
  border: '#DEE2E6',
  headerBg: '#1F2530',
  headerSub: '#A9B0BD',
  rowAlt: '#F8F9FA',
  sectionLine: '#E9ECEF',
};

export type Align = 'left' | 'center' | 'right';

export interface PdfColumn {
  header: string;
  align?: Align;
  width: number; // absolute width in points
}

export interface PdfRow {
  cells: (string | number)[];
  bold?: boolean;
  /** visual total row (top border + bold) */
  total?: boolean;
}

const FONT = 'Helvetica';
const FONT_BOLD = 'Helvetica-Bold';

/** Indian-format currency. */
export function money(v: number | string | null | undefined): string {
  const n = Number(v ?? 0);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function cellText(v: string | number): string {
  if (typeof v === 'number') {
    return Number.isInteger(v) ? String(v) : v.toFixed(2);
  }
  return String(v);
}

/** Wrapped height of a piece of text inside a box of given width. */
function wrappedHeight(doc: PDFKit.PDFDocument, text: string, width: number, fontSize: number): number {
  if (!text) return fontSize;
  return doc.heightOfString(text, { width, lineGap: 2 });
}

export class PdfDoc {
  doc: PDFKit.PDFDocument;
  y: number;
  private pageCount: number;

  constructor() {
    this.doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 48, left: PAGE.margin, right: PAGE.margin },
      info: { Title: 'Urban Furniture Accounting', Author: 'Urban Furniture' },
    });
    this.y = 40;
    this.pageCount = 0;

    // Draw the footer on every page as it is created. pdfkit flushes earlier
    // pages once a new page starts, so retroactive switchToPage is unreliable.
    // lineBreak:false is required — the footer sits inside the bottom margin,
    // and auto page-breaks from the pageAdded handler would recurse forever.
    this.doc.on('pageAdded', () => {
      this.pageCount += 1;
      this.doc
        .font(FONT)
        .fontSize(8)
        .fillColor(COLORS.muted)
        .text('Urban Furniture Accounting System', PAGE.margin, PAGE.footerY, {
          lineBreak: false,
        });
      this.doc.text(
        `Page ${this.pageCount}`,
        PAGE.width - PAGE.margin - 100,
        PAGE.footerY,
        { width: 100, align: 'right', lineBreak: false },
      );
    });
  }

  get pageBottom(): number {
    return PAGE.height - PAGE.margin;
  }

  /** Adds a page and resets the cursor. */
  addPage(): void {
    this.doc.addPage();
    this.y = 40;
  }

  /**
   * Advances the cursor to a fresh page if the given height won't fit.
   * Returns true when a page break happened.
   */
  ensureSpace(height: number): boolean {
    if (this.y + height <= this.pageBottom) return false;
    this.addPage();
    return true;
  }

  /** Section heading with a rule underneath. */
  section(title: string, opts: { size?: number; spaceBefore?: number } = {}): void {
    const size = opts.size ?? 13;
    this.y += opts.spaceBefore ?? 14;
    this.ensureSpace(size + 8);
    this.doc
      .font(FONT_BOLD)
      .fontSize(size)
      .fillColor(COLORS.text)
      .text(title.toUpperCase(), PAGE.margin, this.y, { characterSpacing: 0.4 });
    this.y += size + 4;
    this.doc
      .moveTo(PAGE.margin, this.y)
      .lineTo(PAGE.margin + PAGE.contentWidth, this.y)
      .lineWidth(0.8)
      .strokeColor(COLORS.sectionLine)
      .stroke();
    this.y += 8;
  }

  /** Label/value grid. `labelWidth` per column, rows flow in columns. */
  infoGrid(
    fields: { label: string; value: string }[],
    opts: { columns?: number; columnWidths?: number[]; spaceAfter?: number } = {},
  ): void {
    const columns = opts.columns ?? 2;
    const colGap = 24;
    const colWidth =
      opts.columnWidths?.[0] ?? (PAGE.contentWidth - colGap * (columns - 1)) / columns;
    const rowH = 34;

    for (let i = 0; i < fields.length; i++) {
      const col = i % columns;
      const rowIdx = Math.floor(i / columns);
      const x = PAGE.margin + col * (colWidth + colGap);
      const y = this.y + rowIdx * rowH;
      const f = fields[i]!;
      this.doc
        .font(FONT_BOLD)
        .fontSize(7)
        .fillColor(COLORS.muted)
        .text(f.label.toUpperCase(), x, y, { characterSpacing: 0.5 });
      this.doc
        .font(FONT)
        .fontSize(10)
        .fillColor(COLORS.text)
        .text(f.value || '—', x, y + 11, { width: colWidth - 4, lineGap: 1 });
    }
    this.y += Math.ceil(fields.length / columns) * rowH + (opts.spaceAfter ?? 6);
  }

  /** Full-width table with dynamic row heights and page breaks. */
  table(columns: PdfColumn[], rows: PdfRow[], opts: { spaceAfter?: number } = {}): void {
    const cellPadX = 6;
    const cellPadY = 5;
    const headerH = 26;
    const fontSize = 9;

    // Header
    this.y += 4;
    this.ensureSpace(headerH);
    this.doc
      .rect(PAGE.margin, this.y, PAGE.contentWidth, headerH)
      .fillColor(COLORS.headerBg)
      .fill();
    let x = PAGE.margin;
    columns.forEach((col) => {
      this.doc
        .font(FONT_BOLD)
        .fontSize(8)
        .fillColor(COLORS.lightText)
        .text(col.header.toUpperCase(), x + cellPadX, this.y + 9, {
          width: col.width - cellPadX * 2,
          align: col.align ?? 'left',
        });
      x += col.width;
    });
    this.y += headerH;

    // Rows (one page break between rows, never mid-row)
    rows.forEach((row, ri) => {
      const cellHeights = row.cells.map((c, ci) => {
        const col = columns[ci]!;
        return wrappedHeight(this.doc, cellText(c), col.width - cellPadX * 2, fontSize);
      });
      const rowH = Math.max(...cellHeights) + cellPadY * 2 + 2;

      this.ensureSpace(rowH);

      if (ri % 2 === 1) {
        this.doc.rect(PAGE.margin, this.y, PAGE.contentWidth, rowH).fillColor(COLORS.rowAlt).fill();
      }

      x = PAGE.margin;
      row.cells.forEach((c, ci) => {
        const col = columns[ci]!;
        const isRight = (col.align ?? 'left') === 'right';
        // Right-aligned numbers keep 6pt right padding, otherwise left padding.
        const padX = isRight ? cellPadX : cellPadX;
        this.doc
          .font(row.bold || row.total ? FONT_BOLD : FONT)
          .fontSize(fontSize)
          .fillColor(row.total ? COLORS.dark : COLORS.text)
          .text(cellText(c), x + padX, this.y + cellPadY, {
            width: col.width - cellPadX * 2,
            align: col.align ?? 'left',
            lineGap: 1,
          });
        x += col.width;
      });

      this.y += rowH;
    });

    // Bottom border
    this.doc
      .moveTo(PAGE.margin, this.y)
      .lineTo(PAGE.margin + PAGE.contentWidth, this.y)
      .lineWidth(0.8)
      .strokeColor(COLORS.border)
      .stroke();
    this.y += (opts.spaceAfter ?? 8);
  }

  /** Summary rows: label left, value right. `total` rows get a top rule + bold. */
  summary(
    rows: { label: string; value: string; total?: boolean; highlight?: boolean }[],
    opts: { spaceAfter?: number } = {},
  ): void {
    const valueW = 180;
    rows.forEach((r) => {
      this.ensureSpace(26);
      if (r.highlight) {
        this.doc
          .rect(PAGE.margin, this.y - 2, PAGE.contentWidth, 28)
          .fillColor(COLORS.brand)
          .fill();
        this.doc
          .font(FONT_BOLD)
          .fontSize(11)
          .fillColor(COLORS.lightText)
          .text(r.label, PAGE.margin + 8, this.y + 6);
        this.doc
          .font(FONT_BOLD)
          .fontSize(11)
          .fillColor(COLORS.lightText)
          .text(r.value, PAGE.width - PAGE.margin - valueW, this.y + 6, {
            width: valueW,
            align: 'right',
          });
        this.y += 30;
        return;
      }
      if (r.total) {
        this.doc
          .moveTo(PAGE.margin, this.y - 2)
          .lineTo(PAGE.margin + PAGE.contentWidth, this.y - 2)
          .lineWidth(0.8)
          .strokeColor(COLORS.border)
          .stroke();
        this.y += 2;
      }
      this.doc
        .font(r.total ? FONT_BOLD : FONT)
        .fontSize(r.total ? 10 : 9.5)
        .fillColor(r.total ? COLORS.dark : COLORS.muted)
        .text(r.label, PAGE.margin, this.y);
      this.doc
        .font(FONT_BOLD)
        .fontSize(r.total ? 10 : 9.5)
        .fillColor(COLORS.text)
        .text(r.value, PAGE.width - PAGE.margin - valueW, this.y, { width: valueW, align: 'right' });
      this.y += 22;
    });
    this.y += opts.spaceAfter ?? 8;
  }

  /** Footer is drawn per-page via the pageAdded hook. */
  footer(): void {
    // No-op — pages are already stamped with their footer.
  }
}

/** Generate a PDF into a Buffer (promisified). */
export function buildPdf(generator: (pdf: PdfDoc) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pdf = new PdfDoc();
    const { doc } = pdf;
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    try {
      generator(pdf);
      pdf.footer();
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/** Sends a generated PDF as an inline response. */
export function sendPdfBuffer(res: unknown, buffer: Buffer, fileName: string): void {
  const r = res as { setHeader: (k: string, v: string) => void; send: (b: Buffer) => void };
  r.setHeader('Content-Type', 'application/pdf');
  r.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
  r.setHeader('Content-Length', String(buffer.length));
  r.send(buffer);
}