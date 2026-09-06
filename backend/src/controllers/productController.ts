import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { serializeProduct } from '../utils/serializers';
import { logAudit } from '../services/auditService';

const PRODUCT_INCLUDE = {
  category: true,
  brand: true,
  images: { orderBy: { sortOrder: 'asc' as const } },
};

export async function listProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };
    if (req.query.category_id) where.categoryId = req.query.category_id;
    if (req.query.brand_id) where.brandId = req.query.brand_id;
    if (req.query.is_active !== undefined) {
      where.isActive = req.query.is_active === 'true';
    }
    if (req.query.search) {
      where.OR = [
        { name: { contains: req.query.search, mode: 'insensitive' } },
        { sku: { contains: req.query.search, mode: 'insensitive' } },
        { barcode: { contains: req.query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: PRODUCT_INCLUDE,
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
      include: PRODUCT_INCLUDE,
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
      sku: req.body.sku ?? null,
      barcode: req.body.barcode ?? null,
      hsnCode: req.body.hsn_code ?? null,
      description: req.body.description ?? null,
      brandId: req.body.brand_id ?? null,
      isActive: req.body.is_active !== undefined ? req.body.is_active : true,
    };

    if (req.body.category_name && !req.body.category_id) {
      const category = await prisma.category.upsert({
        where: { name: req.body.category_name },
        update: {},
        create: { name: req.body.category_name },
      });
      data.categoryId = category.id;
    }

    if (req.body.brand_name && !req.body.brand_id) {
      const brand = await prisma.brand.upsert({
        where: { name: req.body.brand_name },
        update: {},
        create: { name: req.body.brand_name },
      });
      data.brandId = brand.id;
    }

    const product = await prisma.product.create({ data, include: PRODUCT_INCLUDE });

    logAudit({
      userId: req.user!.id,
      action: 'create',
      entity: 'product',
      entityId: product.id,
      entityName: product.name,
      newValues: { name: product.name, product_type: product.productType },
      req,
    });

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
    if (req.body.sku !== undefined) data.sku = req.body.sku;
    if (req.body.barcode !== undefined) data.barcode = req.body.barcode;
    if (req.body.hsn_code !== undefined) data.hsnCode = req.body.hsn_code;
    if (req.body.description !== undefined) data.description = req.body.description;
    if (req.body.brand_id !== undefined) data.brandId = req.body.brand_id;
    if (req.body.is_active !== undefined) data.isActive = req.body.is_active;

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data,
      include: PRODUCT_INCLUDE,
    });

    logAudit({
      userId: req.user!.id,
      action: 'update',
      entity: 'product',
      entityId: updated.id,
      entityName: updated.name,
      newValues: { name: updated.name, product_type: updated.productType },
      req,
    });

    res.json(serializeProduct(updated));
  } catch (err) { next(err); }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await prisma.product.findFirst({ where: { id: req.params.id, deletedAt: null } });
    await prisma.product.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });

    logAudit({
      userId: req.user!.id,
      action: 'delete',
      entity: 'product',
      entityId: req.params.id,
      entityName: product?.name ?? undefined,
      oldValues: product ? { name: product.name, product_type: product.productType } : undefined,
      req,
    });

    res.status(204).send();
  } catch (err) { next(err); }
}

export async function bulkDeleteProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const ids: string[] = req.body.ids ?? [];
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('VALIDATION', 'ids array is required', 400);
    }
    const result = await prisma.product.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    res.json({ deleted: result.count });
  } catch (err) { next(err); }
}

export async function bulkToggleProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const ids: string[] = req.body.ids ?? [];
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('VALIDATION', 'ids array is required', 400);
    }
    const isActive = Boolean(req.body.is_active);
    const result = await prisma.product.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { isActive },
    });
    res.json({ updated: result.count });
  } catch (err) { next(err); }
}

export async function addProductImage(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await prisma.product.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!product) throw new AppError('NOT_FOUND', 'Product not found', 404);

    const maxOrder = await prisma.productImage.aggregate({
      where: { productId: req.params.id },
      _max: { sortOrder: true },
    });

    const image = await prisma.productImage.create({
      data: {
        productId: req.params.id,
        imageUrl: req.body.image_url,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });
    res.status(201).json({ id: image.id, image_url: image.imageUrl, sort_order: image.sortOrder });
  } catch (err) { next(err); }
}

export async function removeProductImage(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.productImage.deleteMany({
      where: { id: req.params.imageId, productId: req.params.id },
    });
    res.status(204).send();
  } catch (err) { next(err); }
}