import { PrismaClient, user_role, account_type } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('Admin@123', 12);
  const accountantHash = await bcrypt.hash('Accountant@123', 12);
  const userHash = await bcrypt.hash('User@123', 12);

  await prisma.user.upsert({
    where: { loginId: 'admin' },
    update: {},
    create: {
      name: 'Admin User',
      loginId: 'admin',
      email: 'admin@urbanfurniture.com',
      passwordHash,
      role: user_role.admin,
    },
  });

  await prisma.user.upsert({
    where: { loginId: 'accountant' },
    update: {},
    create: {
      name: 'Accountant User',
      loginId: 'accountant',
      email: 'accountant@urbanfurniture.com',
      passwordHash: accountantHash,
      role: user_role.accountant,
    },
  });

  await prisma.user.upsert({
    where: { loginId: 'user1' },
    update: {},
    create: {
      name: 'Regular User',
      loginId: 'user1',
      email: 'user1@urbanfurniture.com',
      passwordHash: userHash,
      role: user_role.user,
    },
  });

  const coaAccounts = [
    { name: 'Cash', accountType: account_type.cash as any },
    { name: 'Bank', accountType: account_type.bank as any },
    { name: 'Accounts Receivable', accountType: account_type.asset as any },
    { name: 'Accounts Payable', accountType: account_type.liability as any },
    { name: 'Sales Revenue', accountType: account_type.income as any },
    { name: 'Purchase Expense', accountType: account_type.expense as any },
    { name: 'Capital', accountType: account_type.capital as any },
  ];

  for (const acc of coaAccounts) {
    await prisma.chartOfAccount.upsert({
      where: { name: acc.name },
      update: {},
      create: acc,
    });
  }

  const cashAccount = await prisma.chartOfAccount.findUnique({ where: { name: 'Cash' } });
  const bankAccount = await prisma.chartOfAccount.findUnique({ where: { name: 'Bank' } });

  const journals = [
    { name: 'Sale Journal', journalType: 'sale' as const, defaultAccountId: cashAccount!.id },
    { name: 'Purchase Journal', journalType: 'purchase' as const, defaultAccountId: cashAccount!.id },
    { name: 'Bank Journal', journalType: 'bank' as const, defaultAccountId: bankAccount!.id },
    { name: 'Cash Journal', journalType: 'cash' as const, defaultAccountId: cashAccount!.id },
  ];

  for (const journal of journals) {
    await prisma.journal.upsert({
      where: { name: journal.name },
      update: {},
      create: journal,
    });
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
