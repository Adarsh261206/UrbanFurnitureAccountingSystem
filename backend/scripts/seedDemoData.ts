import { PrismaClient } from '@prisma/client';
import { generateSequence } from '../src/services/sequenceService';

const prisma = new PrismaClient();

const YEAR = 2026;
const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const dateStr = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

function dateIn(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

async function main() {
  console.log('Seeding demo data...');

  // ================= CONTACTS =================
  const customerNames = [
    'Rahul Sharma', 'Priya Patel', 'Amit Verma', 'Sneha Reddy', 'Vikram Singh', 'Ananya Iyer',
    'Rohit Mehta', 'Kavita Joshi', 'Arjun Nair', 'Deepika Rao', 'Sanjay Gupta', 'Pooja Desai',
    'Karan Malhotra', 'Neha Kapoor', 'Rajesh Kumar', 'Aarti Agarwal', 'Manish Tiwari', 'Ritika Bansal',
    'Suresh Pillai', 'Nisha Menon', 'Gaurav Khanna', 'Shreya Shah', 'Anil Kulkarni', 'Divya Saxena',
    'Harsh Vardhan', 'Meera Krishnan', 'Nikhil Bhat', 'Simran Kaur', 'Prakash Chandra', 'Anjali Mishra',
    'Deepak Yadav', 'Riya Sen', 'Siddharth Jain', 'Tanvi Choudhary', 'Varun Anand', 'Ishita Ghosh',
    'Aditya Roy', 'Kritika Arora', 'Mohan Das', 'Lakshmi Menon', 'Vivek Saxena', 'Pallavi Hegde',
    'Ramesh Iyer', 'Swati Kale', 'Naveen Reddy', 'Jyoti Rathi', 'Alok Sinha', 'Madhuri Dixit',
    'Ravi Shankar', 'Gayatri Prasad', 'Sandeep Kaur', 'Preeti Nair', 'Tarun Bhardwaj', 'Shalini Verma',
    'Kunal Mehta', 'Asha Rao', 'Jitendra Gupta', 'Sapna Jain', 'Nitin Agarwal', 'Ritu Singh',
  ];
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Hyderabad', 'Ahmedabad', 'Jaipur', 'Lucknow'];
  const vendorNames = [
    'WoodCraft Furnishings', 'Royal Teak Industries', 'Modern Living Pvt Ltd', 'UrbanWood Co', 'Classic Interiors',
    'Heritage Furniture Works', 'Oak & Pine Traders', 'CraftHome Exports', 'Nova Ply & Board', 'Elite Upholstery',
    'Starwood Creations', 'Vintage Mouldings', 'Solid Seating Co', 'DeskCraft Solutions', 'LoungeCraft',
    'BedMaster Industries', 'Wardrobe World', 'Dining Divas', 'Outdoor Living Ltd', 'Decor Nexus',
    'Teak & Rosewood LLP', 'Karigari Crafts', 'Shivam Timber Traders', 'Metro Steel Furniture', 'Ganga Plywood Mart',
  ];
  const states = ['MH', 'DL', 'KA', 'TN', 'WB', 'AP', 'GJ', 'RJ', 'UP', 'HR'];

  // PAN: 5 letters + 4 digits + 1 letter = 10 chars. GSTIN: state(2) + PAN(10) + "1ZM" = 15.
  const panLetters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const genPan = (prefix: string, idx: number): string => {
    const l1 = panLetters[idx % panLetters.length];
    const l2 = panLetters[(idx * 7 + 3) % panLetters.length];
    return `${prefix}${l1}${String(1000 + idx)}${l2}`;
  };

  const customers: string[] = [];
  for (let i = 0; i < customerNames.length; i++) {
    const state = pick(states);
    const pan = genPan('AABC', i);
    const c = await prisma.contact.create({
      data: {
        name: customerNames[i],
        email: `customer${i + 1}@example.com`,
        phone: `98${String(70000000 + i * 137).slice(0, 8)}`,
        street: `${rnd(1, 500)}, ${pick(['MG Road', 'Park Street', 'Lake View', 'Station Rd', 'Market Lane', 'Green Park', 'Rose Avenue', 'Hill Top'])}`,
        city: pick(cities),
        state,
        country: 'India',
        pincode: String(rnd(100001, 700001)),
        contactType: 'customer',
        gstin: `${state}${pan}1ZM`,
        pan,
      },
    });
    customers.push(c.id);
  }
  const vendors: string[] = [];
  for (let i = 0; i < vendorNames.length; i++) {
    const state = pick(states);
    const pan = genPan('AAAC', i);
    const v = await prisma.contact.create({
      data: {
        name: vendorNames[i],
        email: `vendor${i + 1}@example.com`,
        phone: `99${String(50000000 + i * 211).slice(0, 8)}`,
        street: `${rnd(1, 300)}, Industrial Area`,
        city: pick(cities),
        state,
        country: 'India',
        pincode: String(rnd(100001, 700001)),
        contactType: 'vendor',
        gstin: `${state}${pan}1ZM`,
        pan,
      },
    });
    vendors.push(v.id);
  }
  console.log(`Contacts: ${customers.length} customers + ${vendors.length} vendors`);

  // ================= CATEGORIES + PRODUCTS =================
  const categoryData = [
    { name: 'Sofas & Couches', base: 45000, max: 180000 },
    { name: 'Chairs', base: 4500, max: 25000 },
    { name: 'Tables', base: 8000, max: 90000 },
    { name: 'Beds', base: 22000, max: 150000 },
    { name: 'Wardrobes', base: 28000, max: 160000 },
    { name: 'Dining Sets', base: 30000, max: 140000 },
    { name: 'Office Furniture', base: 12000, max: 95000 },
    { name: 'Outdoor Furniture', base: 9000, max: 60000 },
    { name: 'Storage & Shelves', base: 6000, max: 45000 },
    { name: 'Decor & Accessories', base: 1500, max: 20000 },
  ];
  const productNames = {
    'Sofas & Couches': ['L-Shaped Sofa', '3-Seater Fabric Sofa', 'Recliner Sofa', 'Sectional Couch', 'Chesterfield Sofa', 'Sofa Cum Bed', 'Loveseat', 'Bean Bag Lounge'],
    'Chairs': ['Ergonomic Office Chair', 'Dining Chair', 'Rocking Chair', 'Accent Chair', 'Bar Stool', 'Armchair', 'Recliner Chair', 'Plastic Moulded Chair'],
    'Tables': ['Coffee Table', 'Dining Table 6-Seater', 'Study Desk', 'Computer Table', 'Console Table', 'Centre Table', 'Folding Table', 'TV Unit'],
    'Beds': ['King Size Bed', 'Queen Size Bed', 'Single Bed', 'Double Bed with Storage', 'Platform Bed', 'Bunk Bed', 'Hydraulic Bed', 'Divan Bed'],
    'Wardrobes': ['3-Door Wardrobe', 'Sliding Wardrobe', 'Almirah', 'Wardrobe with Mirror', 'Dressing Table Combo', 'Walk-in Closet Units', 'Loft Storage', 'Chest of Drawers'],
    'Dining Sets': ['6-Seater Dining Set', '4-Seater Dining Set', '2-Seater Bistro Set', 'Dining Set with Bench', 'Round Dining Set', '8-Seater Family Set', 'Dining Bench', 'Bar Table Set'],
    'Office Furniture': ['Executive Desk', 'Office Workstation', 'Meeting Table', 'Filing Cabinet', 'Bookshelf', 'Office Chair', 'Reception Desk', 'Staff Bench'],
    'Outdoor Furniture': ['Garden Bench', 'Patio Chair Set', 'Outdoor Dining Table', 'Swing Chair', 'Sun Lounger', 'Balcony Table', 'Garden Umbrella', 'Picnic Table'],
    'Storage & Shelves': ['Wall Shelf Unit', 'Corner Shelf', 'Open Bookcase', 'Shoe Rack', 'Media Console', 'Kitchen Cabinet', 'Sideboard', 'Cupboard'],
    'Decor & Accessories': ['Table Lamp', 'Wall Art Frame', 'Cushion Set', 'Vase Set', 'Wall Clock', 'Mirror', 'Photo Frame', 'Showpiece'],
  };
  const categories: { id: string; name: string }[] = [];
  for (const cd of categoryData) {
    const cat = await prisma.category.create({ data: { name: cd.name } });
    categories.push({ id: cat.id, name: cd.name });
  }

  // ================= BRANDS =================
  const brandNames = ['Godrej Interio', 'Nilkamal', 'WoodenStreet', 'Wakefit', 'Durian', 'Spacewood', 'Featherlite', 'Royal Oak', 'Hometown', 'Urban Ladder'];
  const brands: { id: string; name: string }[] = [];
  for (const bn of brandNames) {
    const b = await prisma.brand.create({ data: { name: bn } });
    brands.push({ id: b.id, name: bn });
  }
  console.log(`Brands: ${brands.length} seeded`);

  const products: { id: string; name: string; categoryId: string }[] = [];
  let pIdx = 0;
  for (const cat of categories) {
    for (const pn of productNames[cat.name as keyof typeof productNames]) {
      const cd = categoryData.find((x) => x.name === cat.name)!;
      const sales = rnd(cd.base, cd.max);
      const cost = Math.round(sales * (0.55 + Math.random() * 0.2));
      const brand = pick(brands);
      const p = await prisma.product.create({
        data: {
          name: `${pn}`,
          productType: 'goods',
          categoryId: cat.id,
          brandId: brand.id,
          sku: `SKU-${String(pIdx + 1).padStart(4, '0')}`,
          barcode: `890${String(10000000000 + pIdx * 7919).slice(0, 9)}`,
          hsnCode: '9403',
          description: `${brand.name} ${pn} — premium furniture piece for home and office.`,
          salesPrice: sales,
          cost,
        },
      });
      products.push({ id: p.id, name: p.name, categoryId: cat.id });
      pIdx++;
    }
  }
  console.log(`Categories: ${categories.length}, Products: ${products.length}`);

  // ================= ACCOUNTS + JOURNALS =================
  const coa = await prisma.chartOfAccount.findMany();
  const ar = coa.find((a) => a.name === 'Accounts Receivable')!;
  const ap = coa.find((a) => a.name === 'Accounts Payable')!;
  const cash = coa.find((a) => a.name === 'Cash')!;
  const bank = coa.find((a) => a.name === 'Bank')!;
  const revenue = coa.find((a) => a.name === 'Sales Revenue')!;
  const expense = coa.find((a) => a.name === 'Purchase Expense')!;
  const capital = coa.find((a) => a.name === 'Capital')!;

  const journals = await prisma.journal.findMany();
  const saleJournal = journals.find((j) => j.journalType === 'sale')!;
  const purchaseJournal = journals.find((j) => j.journalType === 'purchase')!;
  const bankJournal = journals.find((j) => j.journalType === 'bank')!;
  const cashJournal = journals.find((j) => j.journalType === 'cash')!;

  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  const accountant = await prisma.user.findFirst({ where: { role: 'accountant' } });
  const actorId = admin?.id ?? accountant!.id;

  // ================= ANALYTICALS =================
  const analyticals: string[] = [];
  const anaRegions = ['North India Sales', 'South India Sales', 'West India Sales', 'East India Sales', 'Central India Sales', 'Online Channel Sales', 'Retail Store Sales', 'B2B Corporate Sales', 'Export Sales', 'Festival Campaign Sales', 'Mumbai Region', 'Delhi NCR Region'];
  for (let i = 0; i < anaRegions.length; i++) {
    const a = await prisma.analytical.create({
      data: {
        name: anaRegions[i],
        responsibleId: pick(customers),
        startDate: dateIn(YEAR, 1, 1),
        toDate: dateIn(YEAR, 12, 31),
        endDate: dateIn(YEAR, 12, 31),
        analyticAccount: `ANA-${String(i + 1).padStart(3, '0')}`,
      },
    });
    analyticals.push(a.id);
  }
  console.log(`Analyticals: ${analyticals.length}`);

  // ================= SALES ORDERS =================
  const soIds: string[] = [];
  const soCount = 40;
  for (let i = 0; i < soCount; i++) {
    const customerId = pick(customers);
    const month = rnd(1, 8);
    const day = rnd(1, 28);
    const d = dateIn(YEAR, month, day);
    const lineCount = rnd(1, 4);
    const lines = Array.from({ length: lineCount }, () => {
      const prod = pick(products);
      return {
        productId: prod.id,
        accountId: ar.id,
        qty: rnd(1, 6),
        unitPrice: rnd(2000, 60000),
      };
    });
    const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
    const soNumber = await generateSequence('SO');
    const so = await prisma.salesOrder.create({
      data: {
        soNumber,
        customerId,
        date: d,
        invoiceDate: d,
        dueDate: addDays(d, 30),
        total,
        salesOrderLines: {
          create: lines.map((l, idx) => ({
            srNo: idx + 1, productId: l.productId, chartOfAccountId: l.accountId, qty: l.qty, unitPrice: l.unitPrice, total: l.qty * l.unitPrice,
          })),
        },
      },
    });
    // confirm ~65%
    if (Math.random() < 0.65) {
      await prisma.salesOrder.update({ where: { id: so.id }, data: { status: 'confirmed' } });
      const entryNumber = await generateSequence('JE');
      await prisma.journalEntry.create({
        data: {
          entryNumber,
          accountingDate: d,
          journalId: saleJournal.id,
          sourceDocumentType: 'sales_order',
          sourceDocumentId: so.id,
          status: 'posted',
          createdBy: actorId,
          lines: { create: [
            { srNo: 1, accountId: ar.id, partnerId: customerId, debit: total, credit: 0 },
            { srNo: 2, accountId: revenue.id, partnerId: customerId, debit: 0, credit: total },
          ]},
        },
      });
    }
    soIds.push(so.id);
  }
  console.log(`Sales Orders: ${soCount}`);

  // ================= INVOICES =================
  const invoiceIds: string[] = [];
  const invoiceCount = 90;
  for (let i = 0; i < invoiceCount; i++) {
    const customerId = pick(customers);
    const month = rnd(1, 8);
    const day = rnd(1, 28);
    const d = dateIn(YEAR, month, day);
    const lineCount = rnd(1, 4);
    const analyticalId = Math.random() < 0.7 ? pick(analyticals) : null;
    const lines = Array.from({ length: lineCount }, (_, li) => {
      const prod = pick(products);
      return {
        productId: prod.id,
        accountId: ar.id,
        analyticId: li === 0 ? analyticalId : null,
        qty: rnd(1, 5),
        unitPrice: rnd(2500, 80000),
      };
    });
    const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
    const invoiceReference = await generateSequence('INV');
    const invoiceNumber = await generateSequence('INVOICE_NUMBER');
    const inv = await prisma.customerInvoice.create({
      data: {
        invoiceReference,
        invoiceNumber,
        customerId,
        date: d,
        invoiceDate: d,
        dueDate: addDays(d, rnd(15, 45)),
        paymentType: 'receive',
        partnerId: customerId,
        paymentVia: Math.random() < 0.7 ? 'bank' : 'cash',
        total,
        amountDue: total,
        status: 'draft',
        createdBy: actorId,
        invoiceLines: {
          create: lines.map((l, idx) => ({
            srNo: idx + 1, productId: l.productId, chartOfAccountId: l.accountId, budgetAnalyticId: l.analyticId, qty: l.qty, unitPrice: l.unitPrice, total: l.qty * l.unitPrice,
          })),
        },
      },
    });
    // confirm ~85%
    if (Math.random() < 0.85) {
      const entryNumber = await generateSequence('JE');
      const je = await prisma.journalEntry.create({
        data: {
          entryNumber,
          accountingDate: d,
          journalId: saleJournal.id,
          sourceDocumentType: 'customer_invoice',
          sourceDocumentId: inv.id,
          status: 'posted',
          createdBy: actorId,
          lines: { create: [
            { srNo: 1, accountId: ar.id, partnerId: customerId, debit: total, credit: 0 },
            { srNo: 2, accountId: revenue.id, partnerId: customerId, debit: 0, credit: total },
          ]},
        },
      });
      let amountDue = total;
      let status: 'confirmed' | 'paid' = 'confirmed';
      // pay ~75% of confirmed; partial for some
      if (Math.random() < 0.75) {
        const full = Math.random() < 0.8;
        const payAmt = full ? total : Math.round(total * (0.3 + Math.random() * 0.4));
        const paymentNumber = await generateSequence('PAY');
        const payEntryNumber = await generateSequence('JE');
        const via = Math.random() < 0.7 ? 'bank' : 'cash';
        const pay = await prisma.payment.create({
          data: {
            paymentNumber,
            invoiceId: inv.id,
            amount: payAmt,
            paymentVia: via as any,
            paymentDate: addDays(d, rnd(2, 20)),
            status: 'successful',
            createdBy: actorId,
          },
        });
        const tgt = via === 'cash' ? cash : bank;
        const j = via === 'cash' ? cashJournal : bankJournal;
        const pje = await prisma.journalEntry.create({
          data: {
            entryNumber: payEntryNumber,
            accountingDate: addDays(d, rnd(2, 20)),
            journalId: j.id,
            sourceDocumentType: 'payment',
            sourceDocumentId: pay.id,
            status: 'posted',
            createdBy: actorId,
            lines: { create: [
              { srNo: 1, accountId: tgt.id, partnerId: customerId, debit: payAmt, credit: 0 },
              { srNo: 2, accountId: ar.id, partnerId: customerId, debit: 0, credit: payAmt },
            ]},
          },
        });
        await prisma.payment.update({ where: { id: pay.id }, data: { journalEntryId: pje.id } });
        amountDue = total - payAmt;
        status = amountDue <= 0 ? 'paid' : 'confirmed';
      }
      await prisma.customerInvoice.update({ where: { id: inv.id }, data: { status, amountDue, journalEntryId: je.id } });
    }
    invoiceIds.push(inv.id);
  }
  console.log(`Invoices: ${invoiceCount}`);

  // ================= PURCHASE ORDERS =================
  const poIds: string[] = [];
  const poCount = 28;
  for (let i = 0; i < poCount; i++) {
    const vendorId = pick(vendors);
    const month = rnd(1, 8);
    const d = dateIn(YEAR, month, rnd(1, 28));
    const lines = Array.from({ length: rnd(1, 3) }, () => {
      const prod = pick(products);
      return { productId: prod.id, accountId: ap.id, qty: rnd(2, 20), unitPrice: rnd(800, 20000) };
    });
    const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
    const poNumber = await generateSequence('PO');
    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        vendorId,
        date: d,
        billDate: d,
        dueDate: addDays(d, 30),
        total,
        purchaseOrderLines: {
          create: lines.map((l, idx) => ({
            srNo: idx + 1, productId: l.productId, chartOfAccountId: l.accountId, qty: l.qty, unitPrice: l.unitPrice, total: l.qty * l.unitPrice,
          })),
        },
      },
    });
    if (Math.random() < 0.7) {
      await prisma.purchaseOrder.update({ where: { id: po.id }, data: { status: 'confirmed' } });
      const entryNumber = await generateSequence('JE');
      await prisma.journalEntry.create({
        data: {
          entryNumber,
          accountingDate: d,
          journalId: purchaseJournal.id,
          sourceDocumentType: 'purchase_order',
          sourceDocumentId: po.id,
          status: 'posted',
          createdBy: actorId,
          lines: { create: [
            { srNo: 1, accountId: expense.id, partnerId: vendorId, debit: total, credit: 0 },
            { srNo: 2, accountId: ap.id, partnerId: vendorId, debit: 0, credit: total },
          ]},
        },
      });
    }
    poIds.push(po.id);
  }
  console.log(`Purchase Orders: ${poCount}`);

  // ================= BILLS =================
  const billIds: string[] = [];
  const billCount = 65;
  for (let i = 0; i < billCount; i++) {
    const vendorId = pick(vendors);
    const month = rnd(1, 8);
    const d = dateIn(YEAR, month, rnd(1, 28));
    const lineCount = rnd(1, 3);
    const analyticalId = Math.random() < 0.5 ? pick(analyticals) : null;
    const lines = Array.from({ length: lineCount }, (_, li) => {
      const prod = pick(products);
      return {
        productId: prod.id,
        accountId: ap.id,
        analyticId: li === 0 ? analyticalId : null,
        qty: rnd(2, 25),
        unitPrice: rnd(800, 20000),
      };
    });
    const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
    const billReference = await generateSequence('BILL');
    const bill = await prisma.vendorBill.create({
      data: {
        billReference,
        vendorBillNo: `VB-${rnd(1000, 9999)}`,
        vendorId,
        date: d,
        billDate: d,
        dueDate: addDays(d, rnd(15, 45)),
        paymentType: 'send',
        partnerId: vendorId,
        paymentVia: Math.random() < 0.7 ? 'bank' : 'cash',
        total,
        amountDue: total,
        status: 'draft',
        createdBy: actorId,
        billLines: {
          create: lines.map((l, idx) => ({
            srNo: idx + 1, productId: l.productId, chartOfAccountId: l.accountId, budgetAnalyticId: l.analyticId, qty: l.qty, unitPrice: l.unitPrice, total: l.qty * l.unitPrice,
          })),
        },
      },
    });
    if (Math.random() < 0.85) {
      const entryNumber = await generateSequence('JE');
      const je = await prisma.journalEntry.create({
        data: {
          entryNumber,
          accountingDate: d,
          journalId: purchaseJournal.id,
          sourceDocumentType: 'vendor_bill',
          sourceDocumentId: bill.id,
          status: 'posted',
          createdBy: actorId,
          lines: { create: [
            { srNo: 1, accountId: expense.id, partnerId: vendorId, debit: total, credit: 0 },
            { srNo: 2, accountId: ap.id, partnerId: vendorId, debit: 0, credit: total },
          ]},
        },
      });
      let amountDue = total;
      let status: 'confirmed' | 'paid' = 'confirmed';
      if (Math.random() < 0.7) {
        const full = Math.random() < 0.8;
        const payAmt = full ? total : Math.round(total * (0.3 + Math.random() * 0.4));
        const paymentNumber = await generateSequence('PAY');
        const payEntryNumber = await generateSequence('JE');
        const via = Math.random() < 0.7 ? 'bank' : 'cash';
        const pay = await prisma.payment.create({
          data: {
            paymentNumber,
            vendorBillId: bill.id,
            amount: payAmt,
            paymentVia: via as any,
            paymentDate: addDays(d, rnd(2, 20)),
            status: 'successful',
            createdBy: actorId,
          },
        });
        const tgt = via === 'cash' ? cash : bank;
        const j = via === 'cash' ? cashJournal : bankJournal;
        const pje = await prisma.journalEntry.create({
          data: {
            entryNumber: payEntryNumber,
            accountingDate: addDays(d, rnd(2, 20)),
            journalId: j.id,
            sourceDocumentType: 'payment',
            sourceDocumentId: pay.id,
            status: 'posted',
            createdBy: actorId,
            lines: { create: [
              { srNo: 1, accountId: ap.id, partnerId: vendorId, debit: payAmt, credit: 0 },
              { srNo: 2, accountId: tgt.id, partnerId: vendorId, debit: 0, credit: payAmt },
            ]},
          },
        });
        await prisma.payment.update({ where: { id: pay.id }, data: { journalEntryId: pje.id } });
        amountDue = total - payAmt;
        status = amountDue <= 0 ? 'paid' : 'confirmed';
      }
      await prisma.vendorBill.update({ where: { id: bill.id }, data: { status, amountDue, journalEntryId: je.id } });
    }
    billIds.push(bill.id);
  }
  console.log(`Bills: ${billCount}`);

  // ================= BUDGETS =================
  const budgetNames = ['Q1 Sales Target', 'Q2 Sales Target', 'Q3 Sales Target', 'Q4 Sales Target', 'Annual Sales Goal', 'Festival Season Target', 'Online Channel Goal', 'Retail Expansion Budget', 'New Store Opening Budget', 'Warehouse Rental Budget', 'Marketing Campaign Budget', 'Staff Salaries Budget', 'Transport & Logistics Budget', 'Raw Material Budget', 'Showroom Maintenance Budget', 'Annual Purchase Budget'];
  const budgetTypes: ('income' | 'expense')[] = ['income', 'income', 'income', 'income', 'income', 'income', 'income', 'income', 'expense', 'expense', 'expense', 'expense', 'expense', 'expense', 'expense', 'expense'];
  const createdBudgetIds: string[] = [];
  for (let i = 0; i < budgetNames.length; i++) {
    const q = Math.floor(i / 4);
    const startM = q * 3 + 1;
    const endM = q * 3 + 3;
    const committed = budgetTypes[i] === 'income' ? rnd(200000, 900000) : rnd(80000, 300000);
    const budget = await prisma.budget.create({
      data: {
        name: budgetNames[i],
        responsibleId: pick(customers),
        startDate: dateIn(YEAR, startM, 1),
        endDate: dateIn(YEAR, endM, 28),
        type: budgetTypes[i],
        analyticalId: pick(analyticals),
        committedAmount: committed,
        status: 'draft',
      },
    });
    const confirmed = Math.random() < 0.7;
    if (confirmed) {
      await prisma.budget.update({ where: { id: budget.id }, data: { status: 'confirmed' } });
    }
    if (confirmed && Math.random() < 0.3) {
      const revised = await prisma.budget.create({
        data: {
          name: `${budget.name} (Revised)`,
          responsibleId: budget.responsibleId,
          startDate: budget.startDate,
          endDate: budget.endDate,
          type: budget.type,
          analyticalId: budget.analyticalId,
          committedAmount: committed + rnd(20000, 60000),
          status: 'draft',
          originalBudgetId: budget.id,
        },
      });
      await prisma.budget.update({ where: { id: budget.id }, data: { status: 'revised' } });
      createdBudgetIds.push(revised.id);
    }
    if (Math.random() < 0.15) {
      await prisma.budget.update({ where: { id: budget.id }, data: { status: 'cancelled', isArchived: true } });
    }
    createdBudgetIds.push(budget.id);
  }
  console.log(`Budgets: ${createdBudgetIds.length}`);

  // ================= MANUAL JOURNAL ENTRIES =================
  const manualJEs = 8;
  for (let i = 0; i < manualJEs; i++) {
    const month = rnd(1, 8);
    const d = dateIn(YEAR, month, rnd(1, 28));
    const amount = rnd(5000, 50000);
    const entryNumber = await generateSequence('JE');
    const j = pick([bankJournal, cashJournal]);
    const tgt = j.id === bankJournal.id ? bank : cash;
    await prisma.journalEntry.create({
      data: {
        entryNumber,
        accountingDate: d,
        journalId: j.id,
        sourceDocumentType: 'manual',
        sourceDocumentId: null,
        status: 'posted',
        createdBy: actorId,
        lines: { create: [
          { srNo: 1, accountId: tgt.id, debit: amount, credit: 0 },
          { srNo: 2, accountId: capital.id, debit: 0, credit: amount },
        ]},
      },
    });
  }
  console.log(`Manual Journal Entries: ${manualJEs}`);

  // ================= CAPITAL OPENING ENTRY =================
  const openingEntry = await prisma.journalEntry.findFirst({ where: { sourceDocumentType: 'manual' } });
  if (!openingEntry) {
    const entryNumber = await generateSequence('JE');
    await prisma.journalEntry.create({
      data: {
        entryNumber,
        accountingDate: dateIn(YEAR, 1, 1),
        journalId: bankJournal.id,
        sourceDocumentType: 'manual',
        status: 'posted',
        createdBy: actorId,
        lines: { create: [
          { srNo: 1, accountId: bank.id, debit: 500000, credit: 0 },
          { srNo: 2, accountId: capital.id, debit: 0, credit: 500000 },
        ]},
      },
    });
  }

  const counts = {
    contacts: await prisma.contact.count(),
    products: await prisma.product.count(),
    salesOrders: await prisma.salesOrder.count(),
    invoices: await prisma.customerInvoice.count(),
    purchaseOrders: await prisma.purchaseOrder.count(),
    bills: await prisma.vendorBill.count(),
    payments: await prisma.payment.count(),
    journalEntries: await prisma.journalEntry.count(),
    budgets: await prisma.budget.count(),
  };
  console.log('\n=========== DEMO DATA SUMMARY ===========');
  console.log(counts);
  console.log('==========================================');
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });