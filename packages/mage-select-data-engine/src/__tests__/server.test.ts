import { describe, it, expect, vi } from 'vitest';
import { handlePrismaMageRequest, PrismaModel } from '../server';

describe('Server Utilities', () => {
  it('should generate correct prisma arguments for search and pagination', async () => {
    interface TestItem { id: string; name: string }
    const mockModel: PrismaModel<TestItem> = {
      findMany: vi.fn().mockResolvedValue([{ id: '1', name: 'Test' }]),
      count: vi.fn().mockResolvedValue(10),
    };

    const query = {
      page: '2',
      pageSize: '10',
      search: 'alice',
    };

    const result = await handlePrismaMageRequest(mockModel, query, {
      searchColumns: ['name', 'email'],
    });

    // Check findMany call
    expect(mockModel.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { name: { contains: 'alice' } },
          { email: { contains: 'alice' } },
        ],
      },
      skip: 10,
      take: 11,
      orderBy: { id: 'asc' },
      select: undefined,
    });

    expect(result.items).toHaveLength(1);
    expect(result.hasMore).toBe(false); // page 2 of count 10 with pageSize 10
  });

  it('should handle custom orderBy and select', async () => {
    interface TestItem { id: string; name: string }
    const mockModel: PrismaModel<TestItem> = {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    };

    await handlePrismaMageRequest(mockModel, {}, {
      searchColumns: ['name'],
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true },
    });

    expect(mockModel.findMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true },
    }));
  });
});
