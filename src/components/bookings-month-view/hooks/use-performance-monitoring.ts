/**
 * Custom hook for performance monitoring and optimization
 */

import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: number;
}

export function usePerformanceMonitoring(componentName: string, enabled = true) {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    renderStartTime.current = performance.now();
    renderCount.current += 1;

    return () => {
      if (renderStartTime.current) {
        const renderTime = performance.now() - renderStartTime.current;

        // Log slow renders (> 16ms = 60fps)
        if (renderTime > 16) {
          console.warn(`Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`);
        }

        // Log to performance monitoring service in production
        if (process.env.NODE_ENV === 'production') {
          // Example: send to analytics service
          // analytics.track('component_render', { componentName, renderTime, renderCount: renderCount.current });
        }
      }
    };
  });

  const trackInteraction = useCallback((interactionName: string, duration?: number) => {
    if (!enabled) return;

    console.log(`Interaction: ${componentName}.${interactionName}`, duration ? `${duration}ms` : '');

    // Track in production
    if (process.env.NODE_ENV === 'production') {
      // analytics.track('user_interaction', { componentName, interactionName, duration });
    }
  }, [componentName, enabled]);

  return { trackInteraction };
}

/**
 * Hook for debouncing expensive operations
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Hook for throttling function calls
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);

  const throttledCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      callback(...args);
    }
  }, [callback, delay]) as T;

  return throttledCallback;
}

/**
 * Hook for measuring operation performance
 */
export function usePerformanceMeasure(operationName: string) {
  const measure = useCallback(async <T>(
    operation: () => Promise<T> | T
  ): Promise<{ result: T; duration: number }> => {
    const startTime = performance.now();
    const result = await operation();
    const duration = performance.now() - startTime;

    console.log(`Operation ${operationName} took ${duration.toFixed(2)}ms`);

    // Log slow operations
    if (duration > 100) {
      console.warn(`Slow operation: ${operationName} (${duration.toFixed(2)}ms)`);
    }

    return { result, duration };
  }, [operationName]);

  return { measure };
}

/**
 * Hook for virtual scrolling calculations
 */
export function useVirtualScrolling<T>({
  items,
  itemHeight,
  containerHeight,
  scrollTop,
  overscan = 5
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  scrollTop: number;
  overscan?: number;
}) {
  const totalHeight = items.length * itemHeight;
  const visibleItemCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    startIndex + visibleItemCount + overscan * 2
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;

  return {
    totalHeight,
    visibleItems,
    offsetY,
    startIndex,
    endIndex
  };
}

/**
 * Hook for lazy loading with intersection observer
 */
export function useLazyLoading(callback: () => void, options?: IntersectionObserverInit) {
  const targetRef = useRef<Element | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    if (targetRef.current) {
      observer.observe(targetRef.current);
    }

    return () => observer.disconnect();
  }, [callback, options]);

  return targetRef;
}