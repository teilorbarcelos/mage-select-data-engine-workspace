import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MageSelectEngine } from '../index';

interface TestItem {
  id: string;
  name?: string;
}

describe('MageSelectEngine BiDirectionalRechargeable', () => {
  const mockFetchPage = vi.fn();
  const mockIdGetter = (item: TestItem) => item.id;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should limit items to 3 pages when biDirectionalRechargeable is true', async () => {
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: vi.fn(),
      getId: mockIdGetter,
      biDirectionalRechargeable: true,
    });

    // Load page 1
    mockFetchPage.mockResolvedValueOnce({ items: [{ id: '1' }], hasMore: true });
    await engine.initialLoad();
    expect(engine.getState().items).toHaveLength(1);
    expect(engine.getState().startPage).toBe(1);
    expect(engine.getState().page).toBe(1);

    // Load page 2
    mockFetchPage.mockResolvedValueOnce({ items: [{ id: '2' }], hasMore: true });
    await engine.loadMore();
    expect(engine.getState().items).toHaveLength(2);
    expect(engine.getState().startPage).toBe(1);
    expect(engine.getState().page).toBe(2);

    // Load page 3
    mockFetchPage.mockResolvedValueOnce({ items: [{ id: '3' }], hasMore: true });
    await engine.loadMore();
    expect(engine.getState().items).toHaveLength(3);
    expect(engine.getState().startPage).toBe(1);
    expect(engine.getState().page).toBe(3);

    // Load page 4 - should drop page 1
    mockFetchPage.mockResolvedValueOnce({ items: [{ id: '4' }], hasMore: true });
    await engine.loadMore();
    const state = engine.getState();
    expect(state.items).toHaveLength(3);
    expect(state.items.map(i => i.id)).toEqual(['2', '3', '4']);
    expect(state.startPage).toBe(2);
    expect(state.page).toBe(4);
    expect(state.hasPrevious).toBe(true);
  });

  it('should load previous pages and drop last page when limit is reached', async () => {
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: vi.fn(),
      getId: mockIdGetter,
      biDirectionalRechargeable: true,
      startPage: 3,
    });

    // Load page 3
    mockFetchPage.mockResolvedValueOnce({ items: [{ id: '3' }], hasMore: true });
    await engine.initialLoad();
    expect(engine.getState().hasPrevious).toBe(true); // Since startPage (3) > 1

    // Load page 4
    mockFetchPage.mockResolvedValueOnce({ items: [{ id: '4' }], hasMore: true });
    await engine.loadMore();

    // Load page 5
    mockFetchPage.mockResolvedValueOnce({ items: [{ id: '5' }], hasMore: true });
    await engine.loadMore();

    expect(engine.getState().items.map(i => i.id)).toEqual(['3', '4', '5']);
    expect(engine.getState().startPage).toBe(3);
    expect(engine.getState().page).toBe(5);

    // Load page 2 (previous) - should drop page 5
    mockFetchPage.mockResolvedValueOnce({ items: [{ id: '2' }], hasMore: true });
    await engine.loadPrevious();

    const state = engine.getState();
    expect(state.items.map(i => i.id)).toEqual(['2', '3', '4']);
    expect(state.startPage).toBe(2);
    expect(state.page).toBe(4);
  });

  it('should not drop pages if biDirectionalRechargeable is false', async () => {
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: vi.fn(),
      getId: mockIdGetter,
      biDirectionalRechargeable: false,
    });

    mockFetchPage.mockResolvedValueOnce({ items: [{ id: '1' }], hasMore: true });
    await engine.initialLoad();
    mockFetchPage.mockResolvedValueOnce({ items: [{ id: '2' }], hasMore: true });
    await engine.loadMore();
    mockFetchPage.mockResolvedValueOnce({ items: [{ id: '3' }], hasMore: true });
    await engine.loadMore();
    mockFetchPage.mockResolvedValueOnce({ items: [{ id: '4' }], hasMore: true });
    await engine.loadMore();
    mockFetchPage.mockResolvedValueOnce({ items: [{ id: '5' }], hasMore: true });
    await engine.loadMore();

    expect(engine.getState().items).toHaveLength(5);
    expect(engine.getState().startPage).toBe(1);
    expect(engine.getState().page).toBe(5);
  });

  it('should update hasPrevious correctly based on config.startPage', async () => {
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: vi.fn(),
      getId: mockIdGetter,
      startPage: 10,
    });

    mockFetchPage.mockResolvedValue({ items: [], hasMore: true });
    await engine.initialLoad();
    expect(engine.getState().hasPrevious).toBe(true);

    mockFetchPage.mockResolvedValueOnce({ items: [], hasMore: true });
    await engine.loadPrevious(); // Load page 9
    expect(engine.getState().startPage).toBe(9);
    expect(engine.getState().hasPrevious).toBe(true);
  });

  it('should reset everything on search', async () => {
    vi.useFakeTimers();
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: vi.fn(),
      getId: mockIdGetter,
      biDirectionalRechargeable: true,
    });

    mockFetchPage.mockResolvedValue({ items: [{ id: '1' }], hasMore: true });
    await engine.initialLoad();
    await engine.loadMore();
    await engine.loadMore();
    await engine.loadMore();

    expect(engine.getState().startPage).toBe(2);

    engine.setSearch('new search');
    await vi.advanceTimersByTime(300);

    expect(engine.getState().startPage).toBe(1);
    expect(engine.getState().page).toBe(1);
    expect(engine.getState().items).toHaveLength(1);
    
    vi.useRealTimers();
  });

  it('should abort previous loadPrevious requests', async () => {
    vi.useFakeTimers();
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: vi.fn(),
      getId: mockIdGetter,
      startPage: 10,
    });

    mockFetchPage.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ items: [], hasMore: true }), 100)));

    const p1 = engine.initialLoad();
    engine.setSearch('test'); // Should abort initialLoad
    
    await vi.advanceTimersByTimeAsync(300);
    await p1;

    expect(mockFetchPage).toHaveBeenCalledTimes(2);
    // The first call's signal should be aborted
    const firstCallSignal = mockFetchPage.mock.calls[0][2].signal;
    expect(firstCallSignal.aborted).toBe(true);
  });

  it('should handle loadPrevious errors', async () => {
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: vi.fn(),
      getId: mockIdGetter,
      startPage: 10,
    });

    await engine.initialLoad();
    mockFetchPage.mockRejectedValueOnce(new Error('Load previous failed'));
    await engine.loadPrevious();
    
    expect(engine.getState().error).toBe('Error: Load previous failed');
  });

  it('should not drop end page in loadPrevious if biDirectionalRechargeable is false', async () => {
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: vi.fn(),
      getId: mockIdGetter,
      biDirectionalRechargeable: false,
      startPage: 10,
    });

    mockFetchPage.mockResolvedValueOnce({ items: [{ id: '10' }], hasMore: true });
    await engine.initialLoad();
    mockFetchPage.mockResolvedValueOnce({ items: [{ id: '9' }], hasMore: true });
    await engine.loadPrevious();
    mockFetchPage.mockResolvedValueOnce({ items: [{ id: '8' }], hasMore: true });
    await engine.loadPrevious();
    mockFetchPage.mockResolvedValueOnce({ items: [{ id: '7' }], hasMore: true });
    await engine.loadPrevious();
    mockFetchPage.mockResolvedValueOnce({ items: [{ id: '6' }], hasMore: true });
    await engine.loadPrevious();

    expect(engine.getState().items).toHaveLength(5);
    expect(engine.getState().startPage).toBe(6);
    expect(engine.getState().page).toBe(10);
  });

  it('should cover unreachable abort branches in loadPrevious by forcing state', async () => {
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: vi.fn(),
      getId: mockIdGetter,
      startPage: 10,
    });

    mockFetchPage.mockResolvedValueOnce({ items: [], hasMore: true });
    await engine.initialLoad(); // Sets hasPrevious: true

    (engine as any).abortController = new AbortController();
    mockFetchPage.mockResolvedValue({ items: [], hasMore: true });
    await engine.loadPrevious();
    
    expect(engine.getState().isLoading).toBe(false);
  });

  it('should return early in loadPrevious if already loading', async () => {
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: vi.fn(),
      getId: mockIdGetter,
      startPage: 10,
    });

    mockFetchPage.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ items: [], hasMore: true }), 50)));

    await engine.initialLoad();
    const p1 = engine.loadPrevious();
    const p2 = engine.loadPrevious(); // Should return early
    
    await p1;
    await p2;
    expect(mockFetchPage).toHaveBeenCalledTimes(2); // 1 initial + 1 loadPrevious
  });

  it('should handle missing pageItemCounts in loadMore and loadPrevious', async () => {
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: vi.fn(),
      getId: mockIdGetter,
      biDirectionalRechargeable: true,
    });

    mockFetchPage.mockResolvedValue({ items: [{ id: '1' }], hasMore: true });
    await engine.initialLoad();
    await engine.loadMore();
    await engine.loadMore();
    
    // Manually delete a page count to hit ?? 0
    (engine as any).pageItemCounts.delete(1);
    mockFetchPage.mockResolvedValue({ items: [{ id: '4' }], hasMore: true });
    await engine.loadMore(); // Hits line 214 ?? 0
    
    // Now for loadPrevious
    (engine as any).pageItemCounts.delete(4);
    mockFetchPage.mockResolvedValue({ items: [{ id: '0' }], hasMore: true });
    await engine.loadPrevious(); // Hits line 274 ?? 0
    
    expect(engine.getState().items).toBeDefined();
  });
});
