import { redirect } from "next/navigation"

export default async function TimesheetPage() {
  // Leite auf neue Monatsansicht um
  redirect("/timesheet/month")
}

