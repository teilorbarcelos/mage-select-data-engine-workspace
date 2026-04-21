import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MageSelectEngine } from '../index';

describe('MageSelectEngine Coverage Gaps', () => {
  let mockFetchPage: any;
  let mockFetchByIds: any;
  const mockIdGetter = (item: { id: string }) => item.id;

  beforeEach(() => {
    mockFetchPage = vi.fn();
    mockFetchByIds = vi.fn();
  });

  it('should cover getId and subscribe/unsubscribe', () => {
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: mockFetchByIds,
      getId: mockIdGetter,
    });

    expect(engine.getId({ id: 'test' })).toBe('test');

    const listener = vi.fn();
    const unsubscribe = engine.subscribe(listener);
    
    (engine as any).updateState({ initialized: true });
    expect(listener).toHaveBeenCalled();

    unsubscribe();
    listener.mockClear();
    (engine as any).updateState({ initialized: false });
    expect(listener).not.toHaveBeenCalled();
  });

  it('should handle rapid initialLoad calls (AbortController logic)', async () => {
    const engine = new MageSelectEngine({
      fetchPage: () => new Promise(resolve => setTimeout(() => resolve({ items: [], hasMore: false }), 50)),
      fetchByIds: mockFetchByIds,
      getId: mockIdGetter,
    });

    const firstCall = engine.initialLoad();
    const secondCall = engine.initialLoad();

    await Promise.all([firstCall, secondCall]);
    expect(engine.getState().isLoading).toBe(false);
  });

  it('should handle rapid loadMore calls (AbortController logic)', async () => {
    const engine = new MageSelectEngine({
      fetchPage: () => new Promise(resolve => setTimeout(() => resolve({ items: [], hasMore: true }), 50)),
      fetchByIds: mockFetchByIds,
      getId: mockIdGetter,
    });

    mockFetchPage.mockResolvedValueOnce({ items: [], hasMore: true });
    await engine.initialLoad();

    const firstCall = engine.loadMore();
    const secondCall = engine.loadMore();

    await Promise.all([firstCall, secondCall]);
    expect(engine.getState().isLoading).toBe(false);
  });

  it('should cover AbortError branches by manual aborting', async () => {
    const engine = new MageSelectEngine({
      fetchPage: () => new Promise(resolve => setTimeout(() => resolve({ items: [], hasMore: false }), 100)),
      fetchByIds: mockFetchByIds,
      getId: mockIdGetter,
    });

    const loadPromise = engine.initialLoad();
    await new Promise(r => setTimeout(r, 20));
    
    (engine as any).abortController.abort();
    
    await loadPromise;
    expect(engine.getState().isLoading).toBe(false);
  });

  it('should handle loadMore AbortError branches', async () => {
    const engine = new MageSelectEngine({
      fetchPage: () => new Promise(resolve => setTimeout(() => resolve({ items: [], hasMore: true }), 100)),
      fetchByIds: mockFetchByIds,
      getId: mockIdGetter,
    });

    mockFetchPage.mockResolvedValueOnce({ items: [], hasMore: true });
    await engine.initialLoad();

    const loadPromise = engine.loadMore();
    await new Promise(r => setTimeout(r, 20));
    
    (engine as any).abortController.abort();
    
    await loadPromise;
    expect(engine.getState().isLoading).toBe(false);
  });

  it('should cover unreachable abort branches by forcing state', async () => {
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: mockFetchByIds,
      getId: mockIdGetter,
    });

    (engine as any).abortController = new AbortController();
    await engine.initialLoad();
    
    (engine as any).abortController = new AbortController();
    await engine.loadMore();
    
    expect(engine.getState().isLoading).toBe(false);
  });

  it('should handle non-AbortError catch branches', async () => {
    const engine = new MageSelectEngine({
      fetchPage: () => Promise.reject('Generic error'),
      fetchByIds: mockFetchByIds,
      getId: mockIdGetter,
    });

    await engine.initialLoad();
    expect(engine.getState().error).toBe('Generic error');
  });

  it('should hit early return branches (lines 85 and 109)', async () => {
    const engine = new MageSelectEngine({
      fetchPage: mockFetchPage,
      fetchByIds: mockFetchByIds,
      getId: mockIdGetter,
    });

    // Hit line 109 (setSearch with same term)
    await engine.setSearch(''); 
    
    // Hit line 85 (updateState with no changes)
    // We can trigger this by calling updateConfig with the same config
    // Or just calling the private updateState directly if we cast to any
    (engine as any).updateState({ search: '' });
    
    expect(engine.getState().search).toBe('');
  });
});
