import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { serializeBrand } from '../utils/serializers';

export async function listBrands(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };
    if (req.query.search) {
      where.name = { contains: req.query.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: { _count: { select: { products: true } } },
      }),
      prisma.brand.count({ where }),
    ]);

    res.json({ brands: data.map(serializeBrand), total, page, limit });
  } catch (err) { next(err); }
}

export async function getBrand(req: Request, res: Response, next: NextFunction) {
  try {
    const brand = await prisma.brand.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: { _count: { select: { products: true } } },
    });
    if (!brand) throw new AppError('NOT_FOUND', 'Brand not found', 404);
    res.json(serializeBrand(brand));
  } catch (err) { next(err); }
}

export async function createBrand(req: Request, res: Response, next: NextFunction) {
  try {
    const brand = await prisma.brand.create({
      data: { name: req.body.name },
      include: { _count: { select: { products: true } } },
    });
    res.status(201).json(serializeBrand(brand));
  } catch (err) { next(err); }
}

export async function updateBrand(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.brand.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) throw new AppError('NOT_FOUND', 'Brand not found', 404);

    const data: any = {};
    if (req.body.name !== undefined) data.name = req.body.name;

    const updated = await prisma.brand.update({
      where: { id: req.params.id },
      data,
      include: { _count: { select: { products: true } } },
    });
    res.json(serializeBrand(updated));
  } catch (err) { next(err); }
}

export async function deleteBrand(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.brand.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) throw new AppError('NOT_FOUND', 'Brand not found', 404);

    const productCount = await prisma.product.count({ where: { brandId: req.params.id, deletedAt: null } });
    if (productCount > 0) {
      throw new AppError('CONFLICT', `Cannot delete brand with ${productCount} linked product(s)`, 409);
    }

    await prisma.brand.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    res.status(204).send();
  } catch (err) { next(err); }
}