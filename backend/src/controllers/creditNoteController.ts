import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { generateSequence } from '../services/sequenceService';

export async function listCreditNotes(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const where: any = {};

    if (req.query.status) where.status = req.query.status;
    if (req.query.type) where.type = req.query.type;
    if (req.query.contact_id) where.contactId = req.query.contact_id;
    if (req.query.search) {
      where.OR = [
        { number: { contains: req.query.search, mode: 'insensitive' } },
        { contact: { is: { name: { contains: req.query.search, mode: 'insensitive' } } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.creditNote.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { contact: true },
      }),
      prisma.creditNote.count({ where }),
    ]);

    res.json({
      credit_notes: data.map((cn) => ({
        id: cn.id,
        number: cn.number,
        type: cn.type,
        contact_id: cn.contactId,
        contact_name: cn.contact?.name ?? '—',
        date: cn.date.toISOString(),
        due_date: cn.dueDate?.toISOString() ?? null,
        status: cn.status,
        subtotal: Number(cn.subtotal),
        tax_rate: Number(cn.taxRate),
        tax_amount: Number(cn.taxAmount),
        total: Number(cn.total),
        amount_due: Number(cn.amountDue),
        notes: cn.notes ?? null,
        reason: cn.reason ?? null,
        created_at: cn.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    });
  } catch (err) { next(err); }
}

export async function getCreditNote(req: Request, res: Response, next: NextFunction) {
  try {
    const cn = await prisma.creditNote.findUnique({
      where: { id: req.params.id },
      include: {
        contact: true,
        invoice: true,
        bill: true,
      },
    });
    if (!cn) throw new AppError('NOT_FOUND', 'Credit note not found', 404);

    res.json({
      id: cn.id,
      number: cn.number,
      type: cn.type,
      contact_id: cn.contactId,
      contact: cn.contact ? { id: cn.contact.id, name: cn.contact.name, gstin: cn.contact.gstin ?? null } : null,
      invoice_id: cn.invoiceId ?? null,
      invoice_number: cn.invoice?.invoiceNumber ?? null,
      bill_id: cn.billId ?? null,
      bill_reference: cn.bill?.billReference ?? null,
      date: cn.date.toISOString(),
      due_date: cn.dueDate?.toISOString() ?? null,
      status: cn.status,
      subtotal: Number(cn.subtotal),
      tax_rate: Number(cn.taxRate),
      tax_amount: Number(cn.taxAmount),
      total: Number(cn.total),
      amount_due: Number(cn.amountDue),
      notes: cn.notes ?? null,
      reason: cn.reason ?? null,
      created_at: cn.createdAt.toISOString(),
      updated_at: cn.updatedAt.toISOString(),
    });
  } catch (err) { next(err); }
}

export async function createCreditNote(req: Request, res: Response, next: NextFunction) {
  try {
    const contactId = req.body.contact_id ?? req.body.contactId;
    const type = req.body.type ?? 'credit_note';
    const invoiceId = req.body.invoice_id ?? req.body.invoiceId ?? null;
    const billId = req.body.bill_id ?? req.body.billId ?? null;
    const date = req.body.date ?? new Date().toISOString().slice(0, 10);
    const dueDate = req.body.due_date ?? req.body.dueDate ?? null;

    if (!contactId) throw new AppError('CONTACT_REQUIRED', 'Contact is required', 400, 'contact_id');
    if (!['credit_note', 'debit_note'].includes(type)) {
      throw new AppError('INVALID_TYPE', 'Type must be credit_note or debit_note', 400, 'type');
    }

    const subtotal = parseFloat(req.body.subtotal ?? 0);
    const taxRate = parseFloat(req.body.tax_rate ?? 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    const number = await generateSequence('CN');

    const cn = await prisma.creditNote.create({
      data: {
        number,
        type,
        contactId,
        invoiceId,
        billId,
        date: new Date(date),
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'draft',
        subtotal,
        taxRate,
        taxAmount,
        total,
        amountDue: total,
        notes: req.body.notes ?? null,
        reason: req.body.reason ?? null,
        createdBy: req.user!.id,
      },
      include: { contact: true, invoice: true, bill: true },
    });

    res.status(201).json({
      id: cn.id,
      number: cn.number,
      type: cn.type,
      contact_id: cn.contactId,
      contact: cn.contact ? { id: cn.contact.id, name: cn.contact.name, gstin: cn.contact.gstin ?? null } : null,
      invoice_id: cn.invoiceId ?? null,
      invoice_number: cn.invoice?.invoiceNumber ?? null,
      bill_id: cn.billId ?? null,
      bill_reference: cn.bill?.billReference ?? null,
      date: cn.date.toISOString(),
      due_date: cn.dueDate?.toISOString() ?? null,
      status: cn.status,
      subtotal: Number(cn.subtotal),
      tax_rate: Number(cn.taxRate),
      tax_amount: Number(cn.taxAmount),
      total: Number(cn.total),
      amount_due: Number(cn.amountDue),
      notes: cn.notes ?? null,
      reason: cn.reason ?? null,
      created_at: cn.createdAt.toISOString(),
      updated_at: cn.updatedAt.toISOString(),
    });
  } catch (err) { next(err); }
}

export async function updateCreditNote(req: Request, res: Response, next: NextFunction) {
  try {
    const cn = await prisma.creditNote.findUnique({ where: { id: req.params.id } });
    if (!cn) throw new AppError('NOT_FOUND', 'Credit note not found', 404);
    if (cn.status !== 'draft') throw new AppError('DRAFT_REQUIRED', 'Only draft credit notes can be updated', 400);

    const updateData: any = {};
    if (req.body.contact_id !== undefined) updateData.contactId = req.body.contact_id;
    if (req.body.type !== undefined) updateData.type = req.body.type;
    if (req.body.invoice_id !== undefined) updateData.invoiceId = req.body.invoice_id;
    if (req.body.bill_id !== undefined) updateData.billId = req.body.bill_id;
    if (req.body.date !== undefined) updateData.date = new Date(req.body.date);
    if (req.body.due_date !== undefined) updateData.dueDate = req.body.due_date ? new Date(req.body.due_date) : null;
    if (req.body.notes !== undefined) updateData.notes = req.body.notes;
    if (req.body.reason !== undefined) updateData.reason = req.body.reason;

    if (req.body.subtotal !== undefined || req.body.tax_rate !== undefined) {
      const subtotal = parseFloat(req.body.subtotal ?? cn.subtotal);
      const taxRate = parseFloat(req.body.tax_rate ?? cn.taxRate);
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;
      updateData.subtotal = subtotal;
      updateData.taxRate = taxRate;
      updateData.taxAmount = taxAmount;
      updateData.total = total;
      updateData.amountDue = total;
    }

    const updated = await prisma.creditNote.update({
      where: { id: req.params.id },
      data: updateData,
      include: { contact: true, invoice: true, bill: true },
    });

    res.json({
      id: updated.id,
      number: updated.number,
      type: updated.type,
      contact_id: updated.contactId,
      contact: updated.contact ? { id: updated.contact.id, name: updated.contact.name, gstin: updated.contact.gstin ?? null } : null,
      invoice_id: updated.invoiceId ?? null,
      invoice_number: updated.invoice?.invoiceNumber ?? null,
      bill_id: updated.billId ?? null,
      bill_reference: updated.bill?.billReference ?? null,
      date: updated.date.toISOString(),
      due_date: updated.dueDate?.toISOString() ?? null,
      status: updated.status,
      subtotal: Number(updated.subtotal),
      tax_rate: Number(updated.taxRate),
      tax_amount: Number(updated.taxAmount),
      total: Number(updated.total),
      amount_due: Number(updated.amountDue),
      notes: updated.notes ?? null,
      reason: updated.reason ?? null,
      created_at: updated.createdAt.toISOString(),
      updated_at: updated.updatedAt.toISOString(),
    });
  } catch (err) { next(err); }
}

export async function deleteCreditNote(req: Request, res: Response, next: NextFunction) {
  try {
    const cn = await prisma.creditNote.findUnique({ where: { id: req.params.id } });
    if (!cn) throw new AppError('NOT_FOUND', 'Credit note not found', 404);
    if (cn.status !== 'draft') throw new AppError('DRAFT_REQUIRED', 'Only draft credit notes can be deleted', 400);

    await prisma.creditNote.delete({ where: { id: req.params.id } });
    res.json({ message: 'Credit note deleted' });
  } catch (err) { next(err); }
}

export async function confirmCreditNote(req: Request, res: Response, next: NextFunction) {
  try {
    const cn = await prisma.creditNote.findUnique({ where: { id: req.params.id } });
    if (!cn) throw new AppError('NOT_FOUND', 'Credit note not found', 404);
    if (cn.status !== 'draft') throw new AppError('DRAFT_REQUIRED', 'Only draft credit notes can be confirmed', 400);

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.creditNote.update({
        where: { id: req.params.id },
        data: { status: 'confirmed' },
        include: { contact: true, invoice: true, bill: true },
      });

      if (cn.invoiceId && cn.type === 'credit_note') {
        await tx.customerInvoice.update({
          where: { id: cn.invoiceId },
          data: { amountDue: { decrement: Number(cn.total) } },
        });
      } else if (cn.billId && cn.type === 'credit_note') {
        await tx.vendorBill.update({
          where: { id: cn.billId },
          data: { amountDue: { decrement: Number(cn.total) } },
        });
      } else if (cn.invoiceId && cn.type === 'debit_note') {
        await tx.customerInvoice.update({
          where: { id: cn.invoiceId },
          data: { amountDue: { increment: Number(cn.total) } },
        });
      } else if (cn.billId && cn.type === 'debit_note') {
        await tx.vendorBill.update({
          where: { id: cn.billId },
          data: { amountDue: { increment: Number(cn.total) } },
        });
      }

      return updated;
    }, { isolationLevel: 'Serializable' });

    res.json({
      id: result.id,
      number: result.number,
      type: result.type,
      contact_id: result.contactId,
      contact: result.contact ? { id: result.contact.id, name: result.contact.name, gstin: result.contact.gstin ?? null } : null,
      invoice_id: result.invoiceId ?? null,
      invoice_number: result.invoice?.invoiceNumber ?? null,
      bill_id: result.billId ?? null,
      bill_reference: result.bill?.billReference ?? null,
      date: result.date.toISOString(),
      due_date: result.dueDate?.toISOString() ?? null,
      status: result.status,
      subtotal: Number(result.subtotal),
      tax_rate: Number(result.taxRate),
      tax_amount: Number(result.taxAmount),
      total: Number(result.total),
      amount_due: Number(result.amountDue),
      notes: result.notes ?? null,
      reason: result.reason ?? null,
      created_at: result.createdAt.toISOString(),
      updated_at: result.updatedAt.toISOString(),
    });
  } catch (err) { next(err); }
}

export async function cancelCreditNote(req: Request, res: Response, next: NextFunction) {
  try {
    const cn = await prisma.creditNote.findUnique({ where: { id: req.params.id } });
    if (!cn) throw new AppError('NOT_FOUND', 'Credit note not found', 404);
    if (cn.status !== 'draft') throw new AppError('DRAFT_REQUIRED', 'Only draft credit notes can be cancelled', 400);

    const updated = await prisma.creditNote.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' },
      include: { contact: true, invoice: true, bill: true },
    });

    res.json({
      id: updated.id,
      number: updated.number,
      type: updated.type,
      contact_id: updated.contactId,
      contact: updated.contact ? { id: updated.contact.id, name: updated.contact.name, gstin: updated.contact.gstin ?? null } : null,
      invoice_id: updated.invoiceId ?? null,
      invoice_number: updated.invoice?.invoiceNumber ?? null,
      bill_id: updated.billId ?? null,
      bill_reference: updated.bill?.billReference ?? null,
      date: updated.date.toISOString(),
      due_date: updated.dueDate?.toISOString() ?? null,
      status: updated.status,
      subtotal: Number(updated.subtotal),
      tax_rate: Number(updated.taxRate),
      tax_amount: Number(updated.taxAmount),
      total: Number(updated.total),
      amount_due: Number(updated.amountDue),
      notes: updated.notes ?? null,
      reason: updated.reason ?? null,
      created_at: updated.createdAt.toISOString(),
      updated_at: updated.updatedAt.toISOString(),
    });
  } catch (err) { next(err); }
}
