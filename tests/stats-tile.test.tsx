import { render, screen } from '@testing-library/react'
import { StatsTile } from '@/components/stats-tile'

describe('StatsTile', () => {
  it('renders label and children', () => {
    render(<StatsTile label="Netto">2h 30m</StatsTile>)
    expect(screen.getByText('Netto')).toBeInTheDocument()
    expect(screen.getByText('2h 30m')).toBeInTheDocument()
  })
})

