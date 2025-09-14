import { render, screen } from '@testing-library/react'
import { BookingsErrorBoundary } from '@/components/bookings-month-view/components/error-boundary'

function Boom() {
  throw new Error('boom')
}

describe('BookingsErrorBoundary', () => {
  it('shows fallback UI when child throws', () => {
    render(
      <BookingsErrorBoundary>
        {/* @ts-expect-error testing throw */}
        <Boom />
      </BookingsErrorBoundary>
    )
    expect(screen.getByText(/Etwas ist schiefgelaufen/i)).toBeInTheDocument()
  })
})

