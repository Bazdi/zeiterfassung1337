import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fetchYear(year) {
  const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/DE`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Fetch failed ${year}`)
  /** @type {{date:string, localName:string, name:string, global:boolean, counties?:string[]}|any[]} */
  const data = await res.json()
  // Keep global (no counties) or explicitly including DE-NW
  return data.filter(x => !Array.isArray(x.counties) || x.counties?.includes('DE-NW')).map(x => ({
    date: x.date, name: x.localName || x.name
  }))
}

async function run() {
  const years = [2025, 2026, 2027, 2028, 2029]
  const all = []
  for (const y of years) { const arr = await fetchYear(y); for (const a of arr) all.push({ ...a, year: y }) }
  // Upsert into holidays table with region "NW"
  for (const h of all) {
    const d = new Date(h.date + 'T00:00:00.000Z')
    await prisma.holiday.upsert({
      where: { date_region: { date: d, region: 'NW' } },
      update: { name: h.name },
      create: { date: d, region: 'NW', name: h.name },
    })
    process.stdout.write('.')
  }
  console.log(`\nInserted/updated ${all.length} holidays for NRW (${years[0]}–${years[years.length-1]}).`)
}

run().catch(e => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
