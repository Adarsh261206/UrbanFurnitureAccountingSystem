import prisma from '../config/database';

const sequencePrefixes: Record<string, string> = {
  SO: 'SO',
  INV: 'INV',
  PO: 'PO',
  BILL: 'BILL',
  PAY: 'PAY',
  JE: 'JE',
  BUDGET: 'BUDGET',
};

const sequenceNames: Record<string, string> = {
  SO: 'sales_order',
  INV: 'customer_invoice',
  PO: 'purchase_order',
  BILL: 'vendor_bill',
  PAY: 'payment',
  JE: 'journal_entry',
  BUDGET: 'budget',
};

let sequenceCounters: Record<string, number> = {};

export async function generateSequence(prefix: string): Promise<string> {
  const seqName = sequenceNames[prefix];
  if (!seqName) throw new Error(`Unknown sequence prefix: ${prefix}`);

  if (!sequenceCounters[seqName]) {
    const lastEntry = await (prisma as any).journalEntry.findFirst({
      where: { entryNumber: { startsWith: `${prefix}-` } },
      orderBy: { entryNumber: 'desc' },
    });
    if (lastEntry) {
      const num = parseInt(lastEntry.entryNumber.split('-')[1]) || 0;
      sequenceCounters[seqName] = num;
    } else {
      sequenceCounters[seqName] = 0;
    }
  }

  sequenceCounters[seqName]++;
  const padded = String(sequenceCounters[seqName]).padStart(5, '0');
  return `${prefix}-${padded}`;
}

export async function generateSequenceForEntity(entity: string): Promise<string> {
  const prefix = sequencePrefixes[entity];
  if (!prefix) throw new Error(`Unknown entity: ${entity}`);
  return generateSequence(prefix);
}
