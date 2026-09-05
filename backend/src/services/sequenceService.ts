import prisma from '../config/database';

interface SequenceConfig {
  prefix: string;
  model: string;
  field: string;
}

const SEQUENCE_CONFIG: Record<string, SequenceConfig> = {
  SO: { prefix: 'SO', model: 'salesOrder', field: 'soNumber' },
  INV: { prefix: 'INV', model: 'customerInvoice', field: 'invoiceReference' },
  PO: { prefix: 'PO', model: 'purchaseOrder', field: 'poNumber' },
  BILL: { prefix: 'BILL', model: 'vendorBill', field: 'billReference' },
  PAY: { prefix: 'PAY', model: 'payment', field: 'paymentNumber' },
  JE: { prefix: 'JE', model: 'journalEntry', field: 'entryNumber' },
};

const sequenceCounters: Record<string, number> = {};

export async function generateSequence(prefix: string): Promise<string> {
  const config = SEQUENCE_CONFIG[prefix];
  if (!config) throw new Error(`Unknown sequence prefix: ${prefix}`);

  if (sequenceCounters[config.prefix] === undefined) {
    const model = (prisma as any)[config.model];
    if (!model) throw new Error(`Prisma model not found: ${config.model}`);

    const lastRecord = await model.findFirst({
      where: { [config.field]: { startsWith: `${config.prefix}-` } },
      orderBy: { [config.field]: 'desc' },
      select: { [config.field]: true },
    });

    if (lastRecord && lastRecord[config.field]) {
      const num = parseInt(lastRecord[config.field].split('-')[1]) || 0;
      sequenceCounters[config.prefix] = num;
    } else {
      sequenceCounters[config.prefix] = 0;
    }
  }

  sequenceCounters[config.prefix]++;
  const padded = String(sequenceCounters[config.prefix]).padStart(5, '0');
  return `${config.prefix}-${padded}`;
}

export function resetSequenceCounter(prefix: string): void {
  const config = SEQUENCE_CONFIG[prefix];
  if (config) {
    delete sequenceCounters[config.prefix];
  }
}
