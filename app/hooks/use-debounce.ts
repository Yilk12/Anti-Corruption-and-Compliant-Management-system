import { useState, useEffect, useCallback } from 'react'

export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): T {
  const [isDebouncing, setIsDebouncing] = useState(false)

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (isDebouncing) return
      
      setIsDebouncing(true)
      callback(...args)
      
      setTimeout(() => {
        setIsDebouncing(false)
      }, delay)
    },
    [callback, delay, isDebouncing]
  ) as T

  return debouncedCallback
}
