import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMageSelectController } from '../index';
import { useForm, FormProvider } from 'react-hook-form';
import React from 'react';

const mockIdGetter = (item: any) => item.id;

describe('useMageSelectController', () => {
  let mockFetch: any;
  let mockFetchByIds: any;

  beforeEach(() => {
    mockFetch = vi.fn();
    mockFetchByIds = vi.fn();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    const methods = useForm();
    return <FormProvider {...methods}>{children}</FormProvider>;
  };

  it('should initialize without side effects', () => {
    const { result } = renderHook(
      () => useMageSelectController({
        name: 'user',
        engineOrConfig: { 
          fetchPage: mockFetch, 
          fetchByIds: mockFetchByIds,
          getId: mockIdGetter 
        }
      }),
      { wrapper }
    );

    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.initialized).toBe(false);
  });

  it('should allow manual orchestration', async () => {
    mockFetch.mockResolvedValue({ items: [], hasMore: false });
    
    const { result } = renderHook(
      () => useMageSelectController({
        name: 'user',
        engineOrConfig: { 
          fetchPage: mockFetch, 
          fetchByIds: mockFetchByIds,
          getId: mockIdGetter 
        }
      }),
      { wrapper }
    );

    await act(async () => {
      await result.current.initialLoad();
    });

    expect(result.current.state.initialized).toBe(true);
  });

  it('should sync selection with RHF (single, valueType: id)', async () => {
    const { result } = renderHook(
      () => useMageSelectController({
        name: 'user',
        valueType: 'id',
        engineOrConfig: { 
          fetchPage: mockFetch, 
          fetchByIds: mockFetchByIds,
          getId: mockIdGetter 
        }
      }),
      { wrapper }
    );

    const item = { id: '1', name: 'User 1' };
    
    act(() => {
      result.current.toggleSelection(item);
    });

    expect(result.current.state.selectedItems).toContain(item);
    expect(result.current.field.value).toBe('1');

    act(() => {
      result.current.toggleSelection(item);
    });
    expect(result.current.field.value).toBeNull();
  });

  it('should support multiple selection and object valueType', async () => {
    const { result } = renderHook(
      () => useMageSelectController({
        name: 'user',
        multiple: true,
        valueType: 'object',
        engineOrConfig: { 
          fetchPage: mockFetch, 
          fetchByIds: mockFetchByIds,
          getId: mockIdGetter 
        }
      }),
      { wrapper }
    );

    const item1 = { id: '1', name: 'User 1' };
    const item2 = { id: '2', name: 'User 2' };
    
    act(() => {
      result.current.toggleSelection(item1);
      result.current.toggleSelection(item2);
    });

    expect(result.current.field.value).toEqual([item1, item2]);
  });

  it('should handle single selection with object valueType', async () => {
    const { result } = renderHook(
      () => useMageSelectController({
        name: 'user',
        multiple: false,
        valueType: 'object',
        engineOrConfig: { 
          fetchPage: mockFetch, 
          fetchByIds: mockFetchByIds,
          getId: mockIdGetter 
        }
      }),
      { wrapper }
    );

    const item = { id: '1', name: 'User 1' };
    
    act(() => {
      result.current.toggleSelection(item);
    });
    expect(result.current.field.value).toEqual(item);

    act(() => {
      result.current.toggleSelection(item);
    });
    expect(result.current.field.value).toBeNull();
  });

  it('should support multiple selection with id valueType', async () => {
    const { result } = renderHook(
      () => useMageSelectController({
        name: 'user',
        multiple: true,
        valueType: 'id', // This hits line 64 other branch
        engineOrConfig: { 
          fetchPage: mockFetch, 
          fetchByIds: mockFetchByIds,
          getId: mockIdGetter 
        }
      }),
      { wrapper }
    );

    const item1 = { id: '1', name: 'User 1' };
    
    act(() => {
      result.current.toggleSelection(item1);
    });

    expect(result.current.field.value).toEqual(['1']);
  });
});
