/**
 * Loading states and skeleton components for BookingsMonthView
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
// Note: Skeleton component not available, using custom implementation

interface TableSkeletonProps {
  rows?: number;
  className?: string;
}

export function TableSkeleton({ rows = 10, className = '' }: TableSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="h-8 flex-1 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>

      {/* Row skeletons */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="flex gap-2">
          <div className="h-12 flex-1 bg-gray-200 rounded animate-pulse" />
          <div className="h-12 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-12 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-12 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-12 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-12 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-12 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-12 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-12 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}

      {/* Footer skeleton */}
      <div className="flex gap-2 border-t pt-3">
        <div className="h-10 flex-1 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-16 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-16 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-16 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-16 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

interface MonthSelectorSkeletonProps {
  className?: string;
}

export function MonthSelectorSkeleton({ className = '' }: MonthSelectorSkeletonProps) {
  return (
    <div className={`flex items-center gap-3 mb-3 ${className}`}>
      <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}

interface FullPageLoadingProps {
  message?: string;
  className?: string;
}

export function FullPageLoading({
  message = 'Lade Daten...',
  className = ''
}: FullPageLoadingProps) {
  return (
    <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${className}`}>
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600 text-center">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}

interface InlineLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function InlineLoading({
  size = 'md',
  className = ''
}: InlineLoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin`}></div>
    </div>
  );
}

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  children: React.ReactNode;
}

export function LoadingOverlay({
  isVisible,
  message = 'Speichere...',
  children
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isVisible && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded">
          <div className="flex flex-col items-center gap-2">
            <InlineLoading />
            <span className="text-sm text-gray-600">{message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing loading states
 */
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = React.useState(initialState);
  const [loadingMessage, setLoadingMessage] = React.useState<string>('');

  const startLoading = React.useCallback((message = 'Lade...') => {
    setIsLoading(true);
    setLoadingMessage(message);
  }, []);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
    setLoadingMessage('');
  }, []);

  const withLoading = React.useCallback(
    async <T,>(
      operation: () => Promise<T>,
      message = 'Lade...'
    ): Promise<T> => {
      startLoading(message);
      try {
        const result = await operation();
        return result;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    withLoading
  };
}