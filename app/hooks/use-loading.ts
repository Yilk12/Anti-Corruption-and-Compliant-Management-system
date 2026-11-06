import { useState, useCallback } from 'react'

interface UseLoadingOptions {
  minLoadingTime?: number // Minimum time to show loading state (default: 2000ms)
}

export function useLoading(options: UseLoadingOptions = {}) {
  const { minLoadingTime = 2000 } = options
  const [isLoading, setIsLoading] = useState(false)

  const execute = useCallback(
    async <T,>(action: () => Promise<T> | T): Promise<T> => {
      setIsLoading(true)
      const startTime = Date.now()

      try {
        const result = await action()
        
        // Ensure minimum loading time
        const elapsed = Date.now() - startTime
        if (elapsed < minLoadingTime) {
          await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed))
        }
        
        return result
      } catch (error) {
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [minLoadingTime]
  )

  return { isLoading, execute }
}
