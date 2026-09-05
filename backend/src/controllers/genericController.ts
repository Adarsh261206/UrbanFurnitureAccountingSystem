import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/errors';

export class GenericController {
  private model: any;
  private modelName: string;
  private selectFields?: any;
  private includeFields?: any;

  constructor(prisma: PrismaClient, modelName: string, selectFields?: any, includeFields?: any) {
    this.model = (prisma as any)[modelName];
    this.modelName = modelName;
    this.selectFields = selectFields;
    this.includeFields = includeFields;
  }

  async list(query: any) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };

    if (query.search) {
      const searchFields = Object.keys(this.model.fields || {}).filter(
        (f) => this.model.fields[f].type === 'String'
      );
      if (searchFields.length > 0) {
        where.OR = searchFields.slice(0, 3).map((f) => ({
          [f]: { contains: query.search, mode: 'insensitive' },
        }));
      }
    }

    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        ...(this.selectFields ? { select: this.selectFields } : {}),
        ...(this.includeFields ? { include: this.includeFields } : {}),
      }),
      this.model.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getById(id: string) {
    const item = await this.model.findFirst({
      where: { id, deletedAt: null },
      ...(this.selectFields ? { select: this.selectFields } : {}),
      ...(this.includeFields ? { include: this.includeFields } : {}),
    });
    if (!item) throw new AppError('NOT_FOUND', `${this.modelName} not found`, 404);
    return item;
  }

  async create(data: any) {
    const item = await this.model.create({
      data,
      ...(this.selectFields ? { select: this.selectFields } : {}),
    });
    return item;
  }

  async update(id: string, data: any) {
    await this.getById(id);
    const item = await this.model.update({
      where: { id },
      data,
      ...(this.selectFields ? { select: this.selectFields } : {}),
    });
    return item;
  }

  async softDelete(id: string) {
    await this.getById(id);
    await this.model.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
