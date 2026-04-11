export interface MageServerRequest {
  page?: string | number | string[] | unknown;
  search?: string | string[] | unknown;
  columns?: string | string[] | unknown;
  pageSize?: string | number | string[] | unknown;
  sort?: string | string[] | unknown;
  order?: 'asc' | 'desc' | string | unknown;
}

export interface MageHydrationRequest {
  ids?: string | string[] | unknown;
}

/**
 * Standardizes Prisma data fetching for Mage Select components.
 * 
 * @param prismaModel - Use a Prisma model (e.g. prisma.user)
 * @param query - The request query object (usually req.query)
 * @param options - Optional overrides
 * @returns Standardized { items, hasMore } response
 */
export interface PrismaModel<T> {
  findMany(args: {
    take?: number;
    skip?: number;
    where?: Record<string, unknown>;
    orderBy?: Record<string, 'asc' | 'desc'> | Array<Record<string, 'asc' | 'desc'>>;
    select?: Record<string, boolean>;
  }): Promise<T[]>;
  count(args?: { where?: Record<string, unknown> }): Promise<number>;
}

export async function handlePrismaMageRequest<T>(
  prismaModel: PrismaModel<T>,
  query: MageServerRequest,
  options: {
    pageSize?: number;
    orderBy?: Record<string, 'asc' | 'desc'> | Array<Record<string, 'asc' | 'desc'>>;
    where?: Record<string, unknown>;
    select?: Record<string, boolean>;
    searchColumns?: string[];
  } = {}
) {
  const page = Math.max(1, typeof query.page === 'string' ? parseInt(query.page) : (typeof query.page === 'number' ? query.page : 1));
  const pageSize = options.pageSize || (typeof query.pageSize === 'string' ? parseInt(query.pageSize) : (typeof query.pageSize === 'number' ? query.pageSize : 50));
  const search = typeof query.search === 'string' ? query.search : undefined;
  
  const columns = typeof query.columns === 'string' 
    ? query.columns.split(',').filter(Boolean) 
    : (options.searchColumns || []);

  const sort = typeof query.sort === 'string' ? query.sort : undefined;
  const order = (query.order === 'asc' || query.order === 'desc') ? query.order : 'asc';

  let whereClause = options.where || {};

  if (search && columns.length > 0) {
    const searchConditions = columns.map((col) => ({
      [col]: {
        contains: search,
      },
    }));

    if (Object.keys(whereClause).length > 0) {
      whereClause = {
        AND: [whereClause, { OR: searchConditions }],
      };
    } else {
      whereClause = {
        OR: searchConditions,
      };
    }
  }

  const orderBy = sort 
    ? { [sort]: order } as Record<string, 'asc' | 'desc'>
    : (options.orderBy || { id: 'asc' as const });

  const items = await prismaModel.findMany({
    where: whereClause,
    take: pageSize + 1,
    skip: (page - 1) * pageSize,
    orderBy,
    select: options.select,
  });

  let hasMore = false;
  if (items.length > pageSize) {
    hasMore = true;
    items.pop();
  }

  return { items, hasMore };
}

/**
 * Standardizes Prisma hydration fetching for Mage Select components.
 * 
 * @param prismaModel - Use a Prisma model (e.g. prisma.user)
 * @param query - The request query object (usually req.query)
 * @param options - Optional overrides
 * @returns Array of found items
 */
export async function handlePrismaMageHydration<T>(
  prismaModel: PrismaModel<T>,
  query: MageHydrationRequest,
  options: {
    where?: Record<string, unknown>;
  } = {}
) {
  const idsParam = query.ids;
  if (typeof idsParam !== 'string') return [];

  const ids = idsParam.split(',').filter(Boolean);
  if (ids.length === 0) return [];

  const whereClause = {
    ...options.where,
    id: {
      in: ids,
    },
  };

  return await prismaModel.findMany({
    where: whereClause,
  });
}
