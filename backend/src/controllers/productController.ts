import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { serializeProduct } from '../utils/serializers';

export async function listProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };
    if (req.query.category_id) where.categoryId = req.query.category_id;
    if (req.query.search) {
      where.OR = [
        { name: { contains: req.query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ products: data.map(serializeProduct), total, page, limit });
  } catch (err) { next(err); }
}

export async function getProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: { category: true },
    });
    if (!product) throw new AppError('NOT_FOUND', 'Product not found', 404);
    res.json(serializeProduct(product));
  } catch (err) { next(err); }
}

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const data: any = {
      name: req.body.name,
      productType: req.body.product_type,
      categoryId: req.body.category_id,
      salesPrice: req.body.sales_price ?? 0,
      cost: req.body.cost ?? 0,
      imageUrl: req.body.image_url ?? null,
    };

    if (req.body.category_name && !req.body.category_id) {
      const category = await prisma.category.upsert({
        where: { name: req.body.category_name },
        update: {},
        create: { name: req.body.category_name },
      });
      data.categoryId = category.id;
    }

    const product = await prisma.product.create({ data, include: { category: true } });
    res.status(201).json(serializeProduct(product));
  } catch (err) { next(err); }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await prisma.product.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!product) throw new AppError('NOT_FOUND', 'Product not found', 404);

    const data: any = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.product_type !== undefined) data.productType = req.body.product_type;
    if (req.body.category_id !== undefined) data.categoryId = req.body.category_id;
    if (req.body.sales_price !== undefined) data.salesPrice = req.body.sales_price;
    if (req.body.cost !== undefined) data.cost = req.body.cost;
    if (req.body.image_url !== undefined) data.imageUrl = req.body.image_url;

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data,
      include: { category: true },
    });
    res.json(serializeProduct(updated));
  } catch (err) { next(err); }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    res.status(204).send();
  } catch (err) { next(err); }
}