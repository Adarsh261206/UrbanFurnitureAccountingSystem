export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function getPagination(query: any): PaginationParams {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function paginatedResponse(data: any[], total: number, page: number, limit: number) {
  return {
    ...data,
    total,
    page,
    limit,
  };
}
