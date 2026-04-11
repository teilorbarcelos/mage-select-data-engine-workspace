import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMageSelect } from '../index';
import { MageSelectEngine } from 'mage-select-data-engine';

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

    await waitFor(() => {
      expect(result.current.state.initialized).toBe(true);
    });

    expect(result.current.state.items).toEqual([]);
  });

  it('should accept an existing engine instance', async () => {
    const engine = new MageSelectEngine({ fetchPage: mockFetchPage, fetchByIds: vi.fn(), getId: mockIdGetter });
    const { result } = renderHook(() => useMageSelect(engine));

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

    await waitFor(() => {
      expect(result.current.state.items).toEqual(mockData.items);
    });
  });

  it('should trigger search through the engine', async () => {
    const config = { fetchPage: mockFetchPage, fetchByIds: vi.fn(), getId: mockIdGetter };
    mockFetchPage.mockResolvedValue({ items: [], hasMore: false });
    
    const { result } = renderHook(() => useMageSelect(config));

    // Wait for initial load (useEffect) to finish
    await waitFor(() => {
      expect(result.current.state.initialized).toBe(true);
    });

    await act(async () => {
      await result.current.setSearch('new search');
    });

    expect(result.current.state.search).toBe('new search');
    expect(mockFetchPage).toHaveBeenCalledWith(1, 'new search');
  });
});
