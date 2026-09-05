import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

export async function cleanupTestDB() {
  await prisma.payment.deleteMany();
  await prisma.vendorBillLine.deleteMany();
  await prisma.vendorBill.deleteMany();
  await prisma.customerInvoiceLine.deleteMany();
  await prisma.customerInvoice.deleteMany();
  await prisma.purchaseOrderLine.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.salesOrderLine.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.journalEntryLine.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.analytical.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.journal.deleteMany();
  await prisma.chartOfAccount.deleteMany();
  await prisma.user.deleteMany();
  await prisma.sequence.deleteMany();
}

export async function seedTestDB() {
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  const accountantHash = await bcrypt.hash('Accountant@123', 12);
  const userHash = await bcrypt.hash('User@123', 12);

  const admin = await prisma.user.create({
    data: { name: 'Test Admin', loginId: 'testadmin', email: 'testadmin@test.com', passwordHash, role: 'admin' },
  });

  const accountant = await prisma.user.create({
    data: { name: 'Test Accountant', loginId: 'testacc', email: 'testaccountant@test.com', passwordHash: accountantHash, role: 'accountant' },
  });

  const user = await prisma.user.create({
    data: { name: 'Test User', loginId: 'testuser', email: 'testuser@test.com', passwordHash: userHash, role: 'user' },
  });

  const cashAccount = await prisma.chartOfAccount.create({
    data: { name: 'Cash', accountType: 'cash' },
  });

  const bankAccount = await prisma.chartOfAccount.create({
    data: { name: 'Bank', accountType: 'bank' },
  });

  const arAccount = await prisma.chartOfAccount.create({
    data: { name: 'Accounts Receivable', accountType: 'asset' },
  });

  const apAccount = await prisma.chartOfAccount.create({
    data: { name: 'Accounts Payable', accountType: 'liability' },
  });

  const salesRevenue = await prisma.chartOfAccount.create({
    data: { name: 'Sales Revenue', accountType: 'income' },
  });

  const purchaseExpense = await prisma.chartOfAccount.create({
    data: { name: 'Purchase Expense', accountType: 'expense' },
  });

  const capitalAccount = await prisma.chartOfAccount.create({
    data: { name: 'Capital', accountType: 'capital' },
  });

  const saleJournal = await prisma.journal.create({
    data: { name: 'Sale Journal', journalType: 'sale', defaultAccountId: cashAccount.id },
  });

  const purchaseJournal = await prisma.journal.create({
    data: { name: 'Purchase Journal', journalType: 'purchase', defaultAccountId: cashAccount.id },
  });

  const bankJournal = await prisma.journal.create({
    data: { name: 'Bank Journal', journalType: 'bank', defaultAccountId: bankAccount.id },
  });

  const cashJournal = await prisma.journal.create({
    data: { name: 'Cash Journal', journalType: 'cash', defaultAccountId: cashAccount.id },
  });

  const category = await prisma.category.create({
    data: { name: 'Test Category' },
  });

  const product = await prisma.product.create({
    data: {
      name: 'Test Product',
      productType: 'goods',
      categoryId: category.id,
      salesPrice: 100,
      cost: 60,
    },
  });

  const customer = await prisma.contact.create({
    data: { name: 'Test Customer', email: 'customer@test.com', phone: '1234567890' },
  });

  const vendor = await prisma.contact.create({
    data: { name: 'Test Vendor', email: 'vendor@test.com', phone: '0987654321' },
  });

  const analytical = await prisma.analytical.create({
    data: {
      name: 'Test Analytical',
      responsibleId: customer.id,
      startDate: new Date('2025-01-01'),
      toDate: new Date('2025-12-31'),
      endDate: new Date('2025-12-31'),
      analyticAccount: 'ANA-001',
    },
  });

  const sequences = [
    { name: 'so_number', prefix: 'S', yearScope: false },
    { name: 'po_number', prefix: 'P', yearScope: false },
    { name: 'invoice_reference', prefix: 'INV', yearScope: true },
    { name: 'bill_reference', prefix: 'Bill', yearScope: true },
    { name: 'je_entry_number', prefix: 'JE', yearScope: true },
    { name: 'payment_number', prefix: 'PAY', yearScope: true },
  ];

  for (const seq of sequences) {
    await prisma.sequence.create({
      data: { name: seq.name, prefix: seq.prefix, value: 0, yearScope: seq.yearScope },
    });
  }

  return {
    admin,
    accountant,
    user,
    cashAccount,
    bankAccount,
    arAccount,
    apAccount,
    salesRevenue,
    purchaseExpense,
    capitalAccount,
    saleJournal,
    purchaseJournal,
    bankJournal,
    cashJournal,
    category,
    product,
    customer,
    vendor,
    analytical,
  };
}

export function generateToken(user: { id: string; role: string; email: string }): string {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: 900 });
}

export { prisma };
