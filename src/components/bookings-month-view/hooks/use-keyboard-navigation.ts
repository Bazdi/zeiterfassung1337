/**
 * Custom hook for keyboard navigation in the bookings table
 */

import { useCallback, useEffect } from 'react';

interface UseKeyboardNavigationOptions {
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  onNavigateLeft?: () => void;
  onNavigateRight?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
  onTab?: () => void;
  enabled?: boolean;
}

export function useKeyboardNavigation({
  onNavigateUp,
  onNavigateDown,
  onNavigateLeft,
  onNavigateRight,
  onEnter,
  onEscape,
  onTab,
  enabled = true
}: UseKeyboardNavigationOptions) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        onNavigateUp?.();
        break;
      case 'ArrowDown':
        event.preventDefault();
        onNavigateDown?.();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        onNavigateLeft?.();
        break;
      case 'ArrowRight':
        event.preventDefault();
        onNavigateRight?.();
        break;
      case 'Enter':
        event.preventDefault();
        onEnter?.();
        break;
      case 'Escape':
        event.preventDefault();
        onEscape?.();
        break;
      case 'Tab':
        onTab?.();
        break;
    }
  }, [
    enabled,
    onNavigateUp,
    onNavigateDown,
    onNavigateLeft,
    onNavigateRight,
    onEnter,
    onEscape,
    onTab
  ]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);
}

/**
 * Hook for managing focus within table cells
 */
export function useTableFocus() {
  const focusCell = useCallback((rowIndex: number, cellIndex: number) => {
    const cell = document.querySelector(
      `tr:nth-child(${rowIndex + 1}) td:nth-child(${cellIndex + 1}) button, tr:nth-child(${rowIndex + 1}) td:nth-child(${cellIndex + 1}) input`
    ) as HTMLElement;

    if (cell) {
      cell.focus();
      // Scroll into view if needed
      cell.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  const focusNextCell = useCallback(() => {
    const activeElement = document.activeElement;
    if (!activeElement) return;

    const currentCell = activeElement.closest('td');
    if (!currentCell) return;

    const nextCell = currentCell.nextElementSibling as HTMLElement;
    if (nextCell) {
      const focusableElement = nextCell.querySelector('button, input') as HTMLElement;
      if (focusableElement) {
        focusableElement.focus();
      }
    }
  }, []);

  const focusPreviousCell = useCallback(() => {
    const activeElement = document.activeElement;
    if (!activeElement) return;

    const currentCell = activeElement.closest('td');
    if (!currentCell) return;

    const prevCell = currentCell.previousElementSibling as HTMLElement;
    if (prevCell) {
      const focusableElement = prevCell.querySelector('button, input') as HTMLElement;
      if (focusableElement) {
        focusableElement.focus();
      }
    }
  }, []);

  return {
    focusCell,
    focusNextCell,
    focusPreviousCell
  };
}

/**
 * Hook for managing ARIA live regions for screen readers
 */
export function useAriaLive() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const liveRegion = document.getElementById('aria-live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
      // Clear after announcement
      setTimeout(() => {
        if (liveRegion.textContent === message) {
          liveRegion.textContent = '';
        }
      }, 1000);
    }
  }, []);

  const announceError = useCallback((message: string) => {
    announce(message, 'assertive');
  }, [announce]);

  const announceSuccess = useCallback((message: string) => {
    announce(message, 'polite');
  }, [announce]);

  return {
    announce,
    announceError,
    announceSuccess
  };
}