import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useMageSelectController } from '../index';

interface TestItem {
  id: string;
  name?: string;
}

describe('useMageSelectController', () => {
  const mockFetch = vi.fn().mockResolvedValue({ items: [], totalCount: 0, hasMore: false });
  const mockFetchByIds = vi.fn().mockResolvedValue([]);
  const mockIdGetter = (item: TestItem) => item.id;

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    const methods = useForm({
      defaultValues: {
        user: 'user-1'
      }
    });
    return <FormProvider {...methods}>{children}</FormProvider>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize without side effects', async () => {
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
    
    expect(result.current.state.initialized).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockFetchByIds).not.toHaveBeenCalled();
  });

  it('should allow manual orchestration', async () => {
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
});
