import prisma from '../config/database';

interface SequenceConfig {
  name: string;
  prefix: string;
  yearScoped: boolean;
  padding: number;
  separator: string;
}

const SEQUENCE_CONFIG: Record<string, SequenceConfig> = {
  SO: { name: 'so_number', prefix: 'S', yearScoped: false, padding: 5, separator: '' },
  PO: { name: 'po_number', prefix: 'P', yearScoped: false, padding: 5, separator: '' },
  INVOICE_NUMBER: { name: 'invoice_number', prefix: 'INV', yearScoped: false, padding: 5, separator: '-' },
  INV: { name: 'invoice_reference', prefix: 'INV', yearScoped: true, padding: 4, separator: '/' },
  BILL: { name: 'bill_reference', prefix: 'Bill', yearScoped: true, padding: 4, separator: '/' },
  JE: { name: 'je_entry_number', prefix: 'JE', yearScoped: true, padding: 4, separator: '/' },
  PAY: { name: 'payment_number', prefix: 'PAY', yearScoped: true, padding: 4, separator: '/' },
  CN: { name: 'credit_note_number', prefix: 'CN', yearScoped: true, padding: 4, separator: '/' },
};

const ALL_SEQUENCES: SequenceConfig[] = Object.values(SEQUENCE_CONFIG);

async function ensureSequencesExist(): Promise<void> {
  const currentYear = new Date().getFullYear();
  for (const config of ALL_SEQUENCES) {
    const year = config.yearScoped ? currentYear : 0;
    const existing = await prisma.sequence.findFirst({ where: { name: config.name, year } });
    if (!existing) {
      await prisma.sequence.create({
        data: { name: config.name, prefix: config.prefix, value: 0, yearScope: config.yearScoped, year },
      });
    }
  }
}

function formatSequenceNumber(config: SequenceConfig, number: number): string {
  const padded = String(number).padStart(config.padding, '0');
  if (config.yearScoped) {
    const year = new Date().getFullYear();
    return `${config.prefix}/${year}/${padded}`;
  }
  return `${config.prefix}${config.separator}${padded}`;
}

export async function generateSequence(type: string): Promise<string> {
  const config = SEQUENCE_CONFIG[type];
  if (!config) throw new Error(`Unknown sequence type: ${type}`);

  await ensureSequencesExist();

  const currentYear = new Date().getFullYear();
  const year = config.yearScoped ? currentYear : 0;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.sequence.updateMany({
      where: { name: config.name, year },
      data: { value: { increment: 1 } },
    });

    if (updated.count === 0) {
      await tx.sequence.create({
        data: { name: config.name, prefix: config.prefix, value: 1, yearScope: config.yearScoped, year },
      });
    }

    const seq = await tx.sequence.findFirst({ where: { name: config.name, year } });
    if (!seq) throw new Error(`Sequence not found: ${config.name}`);

    return formatSequenceNumber(config, seq.value);
  }, { isolationLevel: 'Serializable' });
}

export function resetSequenceCounter(_type: string): void {
  // No-op: sequences are PostgreSQL-backed, no in-memory state to reset
}