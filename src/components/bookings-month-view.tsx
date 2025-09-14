
"use client";

/**
 * BookingsMonthView - Main component export with error boundary
 *
 * This file now serves as the entry point for the refactored BookingsMonthView component.
 * The actual implementation has been moved to a modular structure for better maintainability.
 */

import { BookingsErrorBoundary } from './bookings-month-view/components/error-boundary';
import BookingsMonthView from './bookings-month-view/index';

export default function BookingsMonthViewWithErrorBoundary(props: any) {
  return (
    <BookingsErrorBoundary
      onError={(error, errorInfo) => {
        // Log to external service in production
        console.error('BookingsMonthView Error:', error, errorInfo);
      }}
    >
      <BookingsMonthView {...props} />
    </BookingsErrorBoundary>
  );
}
