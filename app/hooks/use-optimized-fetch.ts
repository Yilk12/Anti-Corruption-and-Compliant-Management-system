"use client";

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { useState, useEffect } from "react";

interface UseOptimizedFetchOptions {
  minLoadingTime?: number; // Minimum loading time in milliseconds (default: 2000ms)
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  cacheTime?: number;
}

export function useOptimizedFetch<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options: UseOptimizedFetchOptions = {}
): UseQueryResult<T, Error> & { isDelayedLoading: boolean } {
  const {
    minLoadingTime = 2000,
    enabled = true,
    refetchOnMount = false,
    refetchOnWindowFocus = false,
    staleTime = 1000 * 60 * 5, // 5 minutes
    cacheTime = 1000 * 60 * 10, // 10 minutes
  } = options;

  const [isDelayedLoading, setIsDelayedLoading] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);

  const query = useQuery({
    queryKey,
    queryFn,
    enabled,
    refetchOnMount,
    refetchOnWindowFocus,
    staleTime,
    gcTime: cacheTime,
  });

  useEffect(() => {
    if (query.isLoading && !loadingStartTime) {
      setLoadingStartTime(Date.now());
      setIsDelayedLoading(true);
    }

    if (!query.isLoading && loadingStartTime) {
      const elapsed = Date.now() - loadingStartTime;
      const remainingTime = minLoadingTime - elapsed;

      if (remainingTime > 0) {
        const timeout = setTimeout(() => {
          setIsDelayedLoading(false);
          setLoadingStartTime(null);
        }, remainingTime);

        return () => clearTimeout(timeout);
      } else {
        setIsDelayedLoading(false);
        setLoadingStartTime(null);
      }
    }
  }, [query.isLoading, loadingStartTime, minLoadingTime]);

  return {
    ...query,
    isDelayedLoading,
  };
}
