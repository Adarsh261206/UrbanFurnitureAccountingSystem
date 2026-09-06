import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';

export async function getStockLevels(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (req.query.search) {
      where.OR = [
        { name: { contains: req.query.search, mode: 'insensitive' } },
        { sku: { contains: req.query.search, mode: 'insensitive' } },
      ];
    }
    if (req.query.brand_id) where.brandId = req.query.brand_id;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          stockLevel: true,
          brand: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    const data = products.map((p) => {
      const stockQty = p.stockLevel ? Number(p.stockLevel.quantity) : 0;
      const reservedQty = p.stockLevel ? Number(p.stockLevel.reservedQty) : 0;
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        brand: p.brand?.name ?? null,
        stock_quantity: stockQty,
        reserved_qty: reservedQty,
        available_qty: stockQty - reservedQty,
      };
    });

    res.json({ products: data, total, page, limit });
  } catch (err) { next(err); }
}

export async function getStockMoves(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.productId) where.productId = req.query.productId;
    if (req.query.type) where.type = req.query.type;
    if (req.query.from_date || req.query.to_date) {
      where.moveDate = {};
      if (req.query.from_date) where.moveDate.gte = new Date(req.query.from_date as string);
      if (req.query.to_date) where.moveDate.lte = new Date(req.query.to_date as string);
    }

    const [moves, total] = await Promise.all([
      prisma.stockMove.findMany({
        where,
        skip,
        take: limit,
        orderBy: { moveDate: 'desc' },
        include: {
          product: { select: { name: true, sku: true } },
        },
      }),
      prisma.stockMove.count({ where }),
    ]);

    const data = moves.map((m) => ({
      id: m.id,
      product_id: m.productId,
      product_name: m.product.name,
      type: m.type,
      reference_type: m.referenceType,
      reference_id: m.referenceId,
      quantity: Number(m.quantity),
      unit_cost: Number(m.unitCost),
      total_cost: Number(m.totalCost),
      location: m.location,
      notes: m.notes,
      move_date: m.moveDate.toISOString(),
    }));

    res.json({ moves: data, total, page, limit });
  } catch (err) { next(err); }
}

export async function adjustStock(req: Request, res: Response, next: NextFunction) {
  try {
    const { productId, quantity, notes } = req.body;
    if (!productId || quantity === undefined) {
      throw new AppError('VALIDATION', 'productId and quantity are required', 400);
    }

    const product = await prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
    if (!product) throw new AppError('NOT_FOUND', 'Product not found', 404);

    const qty = Number(quantity);
    if (isNaN(qty)) throw new AppError('VALIDATION', 'quantity must be a number', 400);

    await prisma.$transaction(async (tx) => {
      await tx.stockMove.create({
        data: {
          productId,
          type: 'adjustment',
          referenceType: 'manual',
          quantity: qty,
          unitCost: Number(product.cost),
          totalCost: Math.abs(qty) * Number(product.cost),
          notes: notes ?? null,
        },
      });

      const existing = await tx.stockLevel.findUnique({ where: { productId } });
      if (existing) {
        await tx.stockLevel.update({
          where: { productId },
          data: { quantity: Number(existing.quantity) + qty },
        });
      } else {
        await tx.stockLevel.create({
          data: { productId, quantity: qty },
        });
      }
    });

    res.status(201).json({ message: 'Stock adjusted successfully' });
  } catch (err) { next(err); }
}

export async function getStockSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      include: { stockLevel: true },
    });

    let totalStockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of products) {
      const qty = p.stockLevel ? Number(p.stockLevel.quantity) : 0;
      totalStockValue += qty * Number(p.cost);
      if (qty === 0) outOfStockCount++;
      else if (qty <= 10) lowStockCount++;
    }

    res.json({
      total_products: products.length,
      total_stock_value: totalStockValue,
      low_stock_count: lowStockCount,
      out_of_stock_count: outOfStockCount,
    });
  } catch (err) { next(err); }
}
