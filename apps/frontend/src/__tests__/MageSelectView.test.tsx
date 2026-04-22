/// <reference types="@testing-library/jest-dom" />
import { act, render, screen, fireEvent } from '@testing-library/react';
import { MageSelectEngineState } from 'mage-select-data-engine';
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
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
    search: '',
    searchFields: [],
    startPage: 1,
    hasPrevious: false,
  };

  const defaultProps = {
    state: mockState,
    toggleSelection: vi.fn(),
    setSearch: vi.fn(),
    loadMore: vi.fn(),
    loadPrevious: vi.fn(),
    renderItem: (item: TestItem) => item.name,
    renderSelection: (items: TestItem[]) => items.map((i) => i.name).join(', '),
    getId: (item: TestItem) => item.id,
    placeholder: 'Search...',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should trigger loadMore when scrolling to bottom', async () => {
    render(<MageSelectView {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search...');
    await act(async () => {
      input.focus();
    });

    const list = await screen.findByRole('list');

    vi.spyOn(list, 'scrollHeight', 'get').mockReturnValue(1000);
    vi.spyOn(list, 'clientHeight', 'get').mockReturnValue(300);
    vi.spyOn(list, 'scrollTop', 'get').mockReturnValue(700);

    fireEvent.scroll(list);

    expect(defaultProps.loadMore).toHaveBeenCalled();
  });

  it('should trigger loadPrevious when scrolling to top', async () => {
    const propsWithPrev = {
      ...defaultProps,
      state: { ...mockState, hasPrevious: true },
    };

    render(<MageSelectView {...propsWithPrev} />);

    const input = screen.getByPlaceholderText('Search...');
    await act(async () => {
      input.focus();
    });

    const list = await screen.findByRole('list');

    vi.spyOn(list, 'scrollTop', 'get').mockReturnValue(0);

    fireEvent.scroll(list);

    expect(defaultProps.loadPrevious).toHaveBeenCalled();
  });

  it('should trigger loadMore automatically via kickstart if already at bottom', async () => {
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(300);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(300);
    vi.spyOn(HTMLElement.prototype, 'scrollTop', 'get').mockReturnValue(0);

    const { rerender } = render(<MageSelectView {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search...');
    await act(async () => {
      input.focus();
    });

    const propsUpdated = {
      ...defaultProps,
      state: { 
        ...mockState, 
        items: [...mockState.items, { id: '2', name: 'Item 2' }],
        isLoading: false 
      },
    };

    await act(async () => {
      rerender(<MageSelectView {...propsUpdated} />);
    });

    expect(defaultProps.loadMore).toHaveBeenCalled();
  });

  it('should render error message when state has an error', async () => {
    const errorMsg = 'Critical API Error';
    const propsWithError = {
      ...defaultProps,
      state: { ...mockState, error: errorMsg },
    };

    render(<MageSelectView {...propsWithError} />);

    expect(screen.getByText(errorMsg)).toBeInTheDocument();
    expect(screen.getByText(errorMsg)).toHaveClass('mage-select-error-message');
  });
});
