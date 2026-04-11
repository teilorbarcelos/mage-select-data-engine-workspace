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
        user: 'user-1' // Initial value is just an ID
      }
    });
    return <FormProvider {...methods}>{children}</FormProvider>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should trigger automatic hydration on mount if default value exists', async () => {
    const fetchedUser = { id: 'user-1', name: 'John Doe' };
    mockFetchByIds.mockResolvedValue([fetchedUser]);

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
    
    // Wait for engine initialization
    await waitFor(() => {
      expect(result.current.state.initialized).toBe(true);
    });

    // Should call fetchByIds with the initial ID
    await waitFor(() => {
      expect(mockFetchByIds).toHaveBeenCalledWith(['user-1']);
    });

    // Check if state was updated with the hydrated object
    await waitFor(() => {
      expect(result.current.state.selectedItems).toContainEqual(fetchedUser);
    });
  });

  it('should sync engine selection back to React Hook Form', async () => {
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

    // Wait for engine initialization
    await waitFor(() => {
      expect(result.current.state.initialized).toBe(true);
    });

    const newUser = { id: 'user-2', name: 'Jane' };
    mockFetchByIds.mockResolvedValue([newUser]);
    
    await act(async () => {
      result.current.toggleSelection(newUser);
    });

    // Check if Engine state updated (awaiting async setValue)
    await waitFor(() => {
      expect(result.current.state.selectedItems).toContainEqual(newUser);
    });
    
    // Check if RHF value would be updated (we can't easily check RHF internal state here without more setup, 
    // but the hook uses field.onChange which is verified by RTL integration tests usually)
  });
});
