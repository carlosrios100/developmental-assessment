import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useChildStore } from '@/stores/child-store';
import { useEffect } from 'react';

export function useChildren() {
  const { children, isLoading, error, fetchChildren } = useChildStore();

  const query = useQuery({
    queryKey: ['children'],
    queryFn: async () => {
      await fetchChildren();
      return useChildStore.getState().children;
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    children: query.data ?? children,
    isLoading: query.isLoading,
    error: query.error?.message ?? error,
    refetch: query.refetch,
  };
}

export function useChild(childId: string | undefined) {
  const { children, fetchChildren } = useChildStore();

  const query = useQuery({
    queryKey: ['children', childId],
    queryFn: async () => {
      if (!childId) return null;
      // Ensure children are loaded
      if (children.length === 0) {
        await fetchChildren();
      }
      return useChildStore.getState().children.find(c => c.id === childId) ?? null;
    },
    enabled: !!childId,
  });

  return {
    child: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
  };
}
