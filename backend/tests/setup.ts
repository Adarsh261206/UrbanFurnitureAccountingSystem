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
}

export async function seedTestDB() {
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  const accountantHash = await bcrypt.hash('Accountant@123', 12);
  const userHash = await bcrypt.hash('User@123', 12);

  const admin = await prisma.user.upsert({
    where: { loginId: 'testadmin' },
    update: {},
    create: { name: 'Test Admin', loginId: 'testadmin', email: 'testadmin@test.com', passwordHash, role: 'admin' },
  });

  const accountant = await prisma.user.upsert({
    where: { loginId: 'testaccountant' },
    update: {},
    create: { name: 'Test Accountant', loginId: 'testaccountant', email: 'testaccountant@test.com', passwordHash: accountantHash, role: 'accountant' },
  });

  const user = await prisma.user.upsert({
    where: { loginId: 'testuser' },
    update: {},
    create: { name: 'Test User', loginId: 'testuser', email: 'testuser@test.com', passwordHash: userHash, role: 'user' },
  });

  const cashAccount = await prisma.chartOfAccount.upsert({
    where: { name: 'Cash' },
    update: {},
    create: { name: 'Cash', accountType: 'cash' },
  });

  const bankAccount = await prisma.chartOfAccount.upsert({
    where: { name: 'Bank' },
    update: {},
    create: { name: 'Bank', accountType: 'bank' },
  });

  const arAccount = await prisma.chartOfAccount.upsert({
    where: { name: 'Accounts Receivable' },
    update: {},
    create: { name: 'Accounts Receivable', accountType: 'asset' },
  });

  const apAccount = await prisma.chartOfAccount.upsert({
    where: { name: 'Accounts Payable' },
    update: {},
    create: { name: 'Accounts Payable', accountType: 'liability' },
  });

  const salesRevenue = await prisma.chartOfAccount.upsert({
    where: { name: 'Sales Revenue' },
    update: {},
    create: { name: 'Sales Revenue', accountType: 'income' },
  });

  const purchaseExpense = await prisma.chartOfAccount.upsert({
    where: { name: 'Purchase Expense' },
    update: {},
    create: { name: 'Purchase Expense', accountType: 'expense' },
  });

  const capitalAccount = await prisma.chartOfAccount.upsert({
    where: { name: 'Capital' },
    update: {},
    create: { name: 'Capital', accountType: 'capital' },
  });

  const saleJournal = await prisma.journal.upsert({
    where: { name: 'Sale Journal' },
    update: {},
    create: { name: 'Sale Journal', journalType: 'sale', defaultAccountId: cashAccount.id },
  });

  const purchaseJournal = await prisma.journal.upsert({
    where: { name: 'Purchase Journal' },
    update: {},
    create: { name: 'Purchase Journal', journalType: 'purchase', defaultAccountId: cashAccount.id },
  });

  const bankJournal = await prisma.journal.upsert({
    where: { name: 'Bank Journal' },
    update: {},
    create: { name: 'Bank Journal', journalType: 'bank', defaultAccountId: bankAccount.id },
  });

  const cashJournal = await prisma.journal.upsert({
    where: { name: 'Cash Journal' },
    update: {},
    create: { name: 'Cash Journal', journalType: 'cash', defaultAccountId: cashAccount.id },
  });

  const category = await prisma.category.upsert({
    where: { name: 'Test Category' },
    update: {},
    create: { name: 'Test Category' },
  });

  const product = await prisma.product.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Test Product',
      productType: 'goods',
      categoryId: category.id,
      salesPrice: 100,
      cost: 60,
    },
  });

  const customer = await prisma.contact.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: { name: 'Test Customer', email: 'customer@test.com', phone: '1234567890' },
  });

  const vendor = await prisma.contact.upsert({
    where: { email: 'vendor@test.com' },
    update: {},
    create: { name: 'Test Vendor', email: 'vendor@test.com', phone: '0987654321' },
  });

  const analytical = await prisma.analytical.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Test Analytical',
      responsibleId: customer.id,
      startDate: new Date('2025-01-01'),
      toDate: new Date('2025-12-31'),
      endDate: new Date('2025-12-31'),
      analyticAccount: 'ANA-001',
    },
  });

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
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: 86400 });
}

export { prisma };
