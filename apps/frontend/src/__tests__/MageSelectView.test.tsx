/// <reference types="@testing-library/jest-dom" />
import { act, render, screen } from '@testing-library/react';
import { MageSelectEngineState } from 'mage-select-data-engine';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MageSelectView } from '../MageSelectView';

interface TestItem {
  id: string;
  name: string;
}

describe('MageSelectView', () => {
  const mockState: MageSelectEngineState<TestItem> = {
    items: [{ id: '1', name: 'Item 1' }],
    selectedItems: [],
    isLoading: false,
    isHydrating: false,
    hasMore: true,
    page: 1,
    initialized: true,
    error: undefined,
    search: ''
  };

  const defaultProps = {
    state: mockState,
    toggleSelection: vi.fn(),
    setSearch: vi.fn(),
    loadMore: vi.fn(),
    renderItem: (item: TestItem) => item.name,
    renderSelection: (items: TestItem[]) => items.map(i => i.name).join(', '),
    getId: (item: TestItem) => item.id,
    placeholder: 'Search...',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should trigger loadMore automatically when sentinel becomes visible', async () => {
    let observerCallback: IntersectionObserverCallback | undefined;
    const mockObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    } as unknown as IntersectionObserver;

    vi.spyOn(global, 'IntersectionObserver').mockImplementation((cb) => {
      observerCallback = cb;
      return mockObserver;
    });

    render(<MageSelectView {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search...');
    await act(async () => {
      input.focus();
    });

    const list = await screen.findByRole('list');
    expect(list).toBeInTheDocument();

    const callback = observerCallback;
    if (callback) {
      await act(async () => {
        callback([{ isIntersecting: true }] as IntersectionObserverEntry[], mockObserver);
      });
    }

    expect(defaultProps.loadMore).toHaveBeenCalled();
  });

  it('should not trigger loadMore if hasMore is false', async () => {
    let observerCallback: IntersectionObserverCallback | undefined;
    const mockObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    } as unknown as IntersectionObserver;

    vi.spyOn(global, 'IntersectionObserver').mockImplementation((cb) => {
      observerCallback = cb;
      return mockObserver;
    });

    const propsWithNoMore = {
      ...defaultProps,
      state: { ...mockState, hasMore: false }
    };

    render(<MageSelectView {...propsWithNoMore} />);
    
    const input = screen.getByPlaceholderText('Search...');
    await act(async () => {
      input.focus();
    });

    const callback = observerCallback;
    if (callback) {
      await act(async () => {
        callback([{ isIntersecting: true }] as IntersectionObserverEntry[], mockObserver);
      });
    }

    expect(defaultProps.loadMore).not.toHaveBeenCalled();
  });

  it('should render error message when state has an error', async () => {
    const errorMsg = 'Critical API Error';
    const propsWithError = {
      ...defaultProps,
      state: { ...mockState, error: errorMsg }
    };

    render(<MageSelectView {...propsWithError} />);
    
    expect(screen.getByText(errorMsg)).toBeInTheDocument();
    expect(screen.getByText(errorMsg)).toHaveClass('mage-select-error-message');
  });
});
