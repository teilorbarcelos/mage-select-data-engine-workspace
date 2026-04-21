export interface MageServerRequest extends Record<string, unknown> {
  page?: string | number | string[] | unknown;
  search?: string | number | string[] | unknown;
  columns?: string | string[] | unknown;
  pageSize?: string | number | string[] | unknown;
  sort?: string | string[] | unknown;
  order?: 'asc' | 'desc' | string | unknown;
}

export interface MageRequestMappings {
  page?: string;
  pageSize?: string;
  search?: string;
  columns?: string;
  sort?: string;
  order?: string;
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
    searchFields?: string | string[];
    mappings?: MageRequestMappings;
    startPage?: number;
  } = {}
) {
  const { mappings = {}, startPage = 1 } = options;

  const getParam = (key: keyof MageRequestMappings, defaultKey: string) => {
    const mappedKey = mappings[key] || defaultKey;
    return query[mappedKey];
  };

  const pageVal = getParam('page', 'page');
  const page = Math.max(startPage, typeof pageVal === 'string' ? parseInt(pageVal) : (typeof pageVal === 'number' ? pageVal : startPage));
  
  const pageSizeVal = getParam('pageSize', 'pageSize');
  const pageSize = options.pageSize || (typeof pageSizeVal === 'string' ? parseInt(pageSizeVal) : (typeof pageSizeVal === 'number' ? pageSizeVal : 50));
  
  const searchVal = getParam('search', 'search');
  const search = typeof searchVal === 'string' || typeof searchVal === 'number' ? String(searchVal) : undefined;
  
  const columnsVal = getParam('columns', 'columns');
  const columns = typeof columnsVal === 'string' 
    ? columnsVal.split(',').filter(Boolean) 
    : (typeof options.searchFields === 'string' ? [options.searchFields] : (options.searchFields || []));

  const sortVal = getParam('sort', 'sort');
  const sort = typeof sortVal === 'string' ? sortVal : undefined;
  
  const orderVal = getParam('order', 'order');
  const order = (orderVal === 'asc' || orderVal === 'desc') ? orderVal : 'asc';

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
    skip: (page - startPage) * pageSize,
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
