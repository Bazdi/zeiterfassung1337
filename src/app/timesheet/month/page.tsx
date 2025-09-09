import BookingsMonthView from "@/components/bookings-month-view"

export default function Page() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  return <BookingsMonthView initialYear={year} initialMonth={month} />
}

