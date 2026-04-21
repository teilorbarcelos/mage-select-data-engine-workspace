import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MageSelectEngine, createMageSelectEngine } from '../index';

interface TestItem {
  id: string;
  name?: string;
}

describe('MageSelectEngine', () => {
  const mockFetchPage = vi.fn();
  const mockIdGetter = (item: TestItem) => item.id;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: vi.fn(),
      getId: mockIdGetter,
    });

    const state = engine.getState();
    expect(state.items).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.search).toBe('');
    expect(state.searchFields).toEqual([]);
    expect(state.page).toBe(1);
  });

  it('should initialize with custom startPage', () => {
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: vi.fn(),
      getId: mockIdGetter,
      startPage: 0,
    });

    expect(engine.getState().page).toBe(0);
  });

  it('should perform initial load correctly', async () => {
    const mockData = {
      items: [{ id: '1', name: 'Item 1' }],
      hasMore: false,
    };
    mockFetchPage.mockResolvedValue(mockData);

    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: vi.fn(),
      getId: mockIdGetter,
    });

    const promise = engine.initialLoad();
    expect(engine.getState().isLoading).toBe(true);
    
    await promise;

    const state = engine.getState();
    expect(state.items).toEqual(mockData.items);
    expect(state.isLoading).toBe(false);
    expect(mockFetchPage).toHaveBeenCalledWith(1, '', expect.objectContaining({ searchFields: [], signal: expect.any(AbortSignal) }));
  });

  it('should reset page and items when searching', async () => {
    vi.useFakeTimers();
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: vi.fn(),
      getId: mockIdGetter,
    });

    mockFetchPage.mockResolvedValue({ items: [], hasMore: false });

    engine.setSearch('test');
    await vi.advanceTimersByTimeAsync(300);
    
    expect(engine.getState().search).toBe('test');
    expect(engine.getState().page).toBe(1);
    expect(mockFetchPage).toHaveBeenCalledWith(1, 'test', expect.objectContaining({ searchFields: [], signal: expect.any(AbortSignal) }));
    vi.useRealTimers();
  });

  it('should pass searchFields to fetchPage', async () => {
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: vi.fn(),
      getId: mockIdGetter,
      searchFields: ['name', 'email'],
    });

    mockFetchPage.mockResolvedValue({ items: [], hasMore: false });
    await engine.initialLoad();

    expect(mockFetchPage).toHaveBeenCalledWith(1, '', expect.objectContaining({ searchFields: ['name', 'email'] }));
  });

  it('should load more items correctly', async () => {
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: vi.fn(),
      getId: mockIdGetter,
    });

    mockFetchPage.mockResolvedValueOnce({ items: [{ id: '1' }], hasMore: true });
    await engine.initialLoad();

    mockFetchPage.mockResolvedValueOnce({ items: [{ id: '2' }], hasMore: false });
    await engine.loadMore();

    const state = engine.getState();
    expect(state.items).toHaveLength(2);
    expect(state.page).toBe(2);
    expect(state.hasMore).toBe(false);
  });

  it('should manage selections correctly', () => {
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: vi.fn(),
      getId: mockIdGetter,
    });

    const item = { id: '1', name: 'Selected' };
    engine.toggleSelection(item);
    
    expect(engine.getState().selectedItems).toContain(item);
    
    engine.toggleSelection(item);
    expect(engine.getState().selectedItems).not.toContain(item);
  });

  it('should handle fetchPage errors', async () => {
    const errorMsg = 'Network Error';
    mockFetchPage.mockRejectedValue(new Error(errorMsg));
    
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: vi.fn(),
      getId: mockIdGetter,
    });

    await engine.initialLoad();
    
    expect(engine.getState().error).toContain(errorMsg);
    expect(engine.getState().isLoading).toBe(false);
  });

  it('should handle fetchByIds errors during hydration', async () => {
    const errorMsg = 'Hydration Failed';
    const mockFetchByIds = vi.fn().mockRejectedValue(new Error(errorMsg));
    
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: mockFetchByIds,
      getId: mockIdGetter,
    });
    
    await engine.setValue(['1']);
    
    expect(engine.getState().error).toContain(errorMsg);
    expect(engine.getState().isHydrating).toBe(false);
  });

  it('should abort previous requests when searching rapidly', async () => {
    vi.useFakeTimers();
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: vi.fn(),
      getId: mockIdGetter,
    });

    mockFetchPage.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ items: [], hasMore: false }), 100)));

    engine.setSearch('test1');
    await vi.advanceTimersByTimeAsync(300); // Trigger search
    
    engine.setSearch('test2');
    await vi.advanceTimersByTimeAsync(300); // Trigger another search
    
    expect(mockFetchPage).toHaveBeenCalledTimes(2);
    const firstCallSignal = mockFetchPage.mock.calls[0][2].signal;
    expect(firstCallSignal.aborted).toBe(true);
    
    vi.useRealTimers();
  });

  it('should enforce cache limit', async () => {
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: vi.fn(),
      getId: mockIdGetter,
      cacheLimit: 2,
    });

    mockFetchPage.mockResolvedValueOnce({ items: [{ id: '1' }, { id: '2' }], hasMore: true });
    await engine.initialLoad();

    expect(engine.getState().items).toHaveLength(2);

    mockFetchPage.mockResolvedValueOnce({ items: [{ id: '3' }], hasMore: false });
    await engine.loadMore();

    const mockFetchByIds = vi.fn().mockResolvedValue([{ id: '1' }]);
    engine.updateConfig({
      fetchPage: mockFetchPage,
      fetchByIds: mockFetchByIds,
      getId: mockIdGetter,
      cacheLimit: 2,
    });

    await engine.setValue(['1']);
    expect(mockFetchByIds).toHaveBeenCalledWith(['1']);
  });

  it('should support setSearchFields', async () => {
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: vi.fn(),
      getId: mockIdGetter,
    });

    mockFetchPage.mockResolvedValue({ items: [], hasMore: false });
    
    engine.setSearchFields(['email']);
    expect(engine.getState().searchFields).toEqual(['email']);
    expect(engine.getState().initialized).toBe(false);

    engine.setSearch('test');
    engine.setSearchFields(['name']);
    expect(mockFetchPage).toHaveBeenCalled();
  });

  it('should have a factory function', () => {
    const engine = createMageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: vi.fn(),
      getId: mockIdGetter,
    });
    expect(engine).toBeInstanceOf(MageSelectEngine);
  });

  it('should handle loadMore errors', async () => {
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: vi.fn(),
      getId: mockIdGetter,
    });
    mockFetchPage.mockResolvedValueOnce({ items: [], hasMore: true });
    await engine.initialLoad();
    
    mockFetchPage.mockRejectedValueOnce(new Error('Load more failed'));
    await engine.loadMore();
    expect(engine.getState().error).toBe('Error: Load more failed');
  });

  it('should handle empty setValue', async () => {
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: vi.fn(),
      getId: mockIdGetter,
    });
    await engine.setValue([]);
    expect(engine.getState().selectedItems).toEqual([]);
  });
});
