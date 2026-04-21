import { act, renderHook, waitFor } from '@testing-library/react';
import { MageSelectEngine, MageSelectEngineConfig } from 'mage-select-data-engine';
import { describe, expect, it, vi } from 'vitest';
import { useMageSelect } from '../index';

interface TestItem {
  id: string;
  name?: string;
}

describe('useMageSelect', () => {
  const mockFetchPage = vi.fn().mockResolvedValue({ items: [], totalCount: 0, hasMore: false });
  const mockIdGetter = (item: TestItem) => item.id;
  
  it('should initialize with engine state', async () => {
    const config = { fetchPage: mockFetchPage, fetchByIds: vi.fn(), getId: mockIdGetter };
    const { result } = renderHook(() => useMageSelect(config));

    act(() => {
      result.current.initialLoad();
    });

    await waitFor(() => {
      expect(result.current.state.initialized).toBe(true);
    });

    expect(result.current.state.items).toEqual([]);
  });

  it('should accept an existing engine instance', async () => {
    const engine = new MageSelectEngine({ fetchPage: mockFetchPage, fetchByIds: vi.fn(), getId: mockIdGetter });
    const { result } = renderHook(() => useMageSelect(engine));

    act(() => {
      result.current.initialLoad();
    });

    await waitFor(() => {
      expect(result.current.state.initialized).toBe(true);
    });

    expect(result.current.engine).toBe(engine);
  });

  it('should update state when engine state changes', async () => {
    const mockData = { items: [{ id: '1', name: 'Test' }], hasMore: false };
    mockFetchPage.mockResolvedValue(mockData);

    const config = { fetchPage: mockFetchPage, fetchByIds: vi.fn(), getId: mockIdGetter };
    const { result } = renderHook(() => useMageSelect(config));

    act(() => {
      result.current.initialLoad();
    });

    await waitFor(() => {
      expect(result.current.state.items).toEqual(mockData.items);
    });
  });

  it('should trigger search through the engine', async () => {
    const config = { fetchPage: mockFetchPage, fetchByIds: vi.fn(), getId: mockIdGetter };
    mockFetchPage.mockResolvedValue({ items: [], hasMore: false });
    
    const { result } = renderHook(() => useMageSelect(config));

    act(() => {
      result.current.initialLoad();
    });

    await waitFor(() => {
      expect(result.current.state.initialized).toBe(true);
    });
    vi.useFakeTimers();
    
    await act(async () => {
      result.current.setSearch('new search');
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.state.search).toBe('new search');
    expect(mockFetchPage).toHaveBeenCalledWith(1, 'new search', expect.objectContaining({ searchFields: [], signal: expect.any(AbortSignal) }));
    
    vi.useRealTimers();
  });

  it('should return stable method references', () => {
    const config = { fetchPage: mockFetchPage, fetchByIds: vi.fn(), getId: mockIdGetter };
    const { result, rerender } = renderHook(({ cfg }) => useMageSelect(cfg), {
      initialProps: { cfg: config as MageSelectEngineConfig<TestItem> | MageSelectEngine<TestItem> }
    });

    const initialMethods = {
      loadMore: result.current.loadMore,
      setSearch: result.current.setSearch,
      setSearchFields: result.current.setSearchFields,
      toggleSelection: result.current.toggleSelection,
      setValue: result.current.setValue,
    };

    rerender({ cfg: { ...config } });

    expect(result.current.loadMore).toBe(initialMethods.loadMore);
    expect(result.current.setSearch).toBe(initialMethods.setSearch);
    expect(result.current.setSearchFields).toBe(initialMethods.setSearchFields);
    expect(result.current.toggleSelection).toBe(initialMethods.toggleSelection);
    expect(result.current.setValue).toBe(initialMethods.setValue);
  });
});
