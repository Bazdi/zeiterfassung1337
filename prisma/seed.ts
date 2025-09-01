import { PrismaClient, Category } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password_hash: adminPassword,
      role: 'ADMIN',
      active: true,
    },
  })

  console.log('Created admin user:', admin.username)

  // Create regular users
  const user1Password = await bcrypt.hash('user123', 12)
  const user1 = await prisma.user.upsert({
    where: { username: 'user1' },
    update: {},
    create: {
      username: 'user1',
      password_hash: user1Password,
      role: 'USER',
      active: true,
    },
  })

  const user2Password = await bcrypt.hash('user123', 12)
  const user2 = await prisma.user.upsert({
    where: { username: 'user2' },
    update: {},
    create: {
      username: 'user2',
      password_hash: user2Password,
      role: 'USER',
      active: true,
    },
  })

  console.log('Created regular users:', user1.username, user2.username)

  // Create default rates
  const rates = [
    { code: 'base_rate', label: 'Stundenlohn', hourly_rate: 16.43, applies_to: 'manual', is_base_rate: true },
    { code: 'regular', label: 'Regulär', multiplier: 1.0, applies_to: 'manual' },
    { code: 'night_mon_fri', label: 'Nacht Mo-Fr ab 21:00', multiplier: 1.25, applies_to: 'night', time_window: JSON.stringify({ days: [1,2,3,4,5], start_hour: 21 }) },
    { code: 'weekend_afternoon', label: 'Wochenende ab 13:00', multiplier: 1.20, applies_to: 'weekend', time_window: JSON.stringify({ days: [0,6], start_hour: 13 }) },
    { code: 'sunday', label: 'Sonntag', multiplier: 1.25, applies_to: 'weekend', time_window: JSON.stringify({ days: [0], start_hour: 0 }) },
    { code: 'holiday', label: 'Feiertag', multiplier: 2.35, applies_to: 'holiday' },
    { code: 'sick', label: 'Krankheitstag', fixed_amount: 11.45, fixed_hours: 0.7, applies_to: 'sick' },
    { code: 'vacation', label: 'Urlaubstag', fixed_amount: 79.46, fixed_hours: 4.88, applies_to: 'vacation' },
    { code: 'monthly_bonus', label: 'Monatlicher Zuschlag', fixed_amount: 24.645, fixed_hours: 1.5, applies_to: 'manual' },
  ]

  for (const rate of rates) {
    await prisma.rate.upsert({
      where: { code: rate.code },
      update: {},
      create: rate,
    })
  }

  console.log('Created default rates')

  // Create NRW holidays for 2024
  const holidays2024 = [
    { date: new Date('2024-01-01'), name: 'Neujahr' },
    { date: new Date('2024-03-29'), name: 'Karfreitag' },
    { date: new Date('2024-04-01'), name: 'Ostermontag' },
    { date: new Date('2024-05-01'), name: 'Tag der Arbeit' },
    { date: new Date('2024-05-09'), name: 'Christi Himmelfahrt' },
    { date: new Date('2024-05-20'), name: 'Pfingstmontag' },
    { date: new Date('2024-10-03'), name: 'Tag der Deutschen Einheit' },
    { date: new Date('2024-12-25'), name: '1. Weihnachtstag' },
    { date: new Date('2024-12-26'), name: '2. Weihnachtstag' },
  ]

  for (const holiday of holidays2024) {
    await prisma.holiday.upsert({
      where: { 
        date_region: {
          date: holiday.date,
          region: 'NW'
        }
      },
      update: {},
      create: {
        date: holiday.date,
        region: 'NW',
        name: holiday.name,
      },
    })
  }

  console.log('Created NRW holidays for 2024')

  // Create default settings
  const settings = [
    { key: 'default_work_hours', value_json: JSON.stringify(8) },
    { key: 'timezone', value_json: JSON.stringify('Europe/Berlin') },
    { key: 'rounding_enabled', value_json: JSON.stringify(false) },
    { key: 'rounding_minutes', value_json: JSON.stringify(15) },
    { key: 'csv_delimiter', value_json: JSON.stringify(';') },
    { key: 'csv_include_bom', value_json: JSON.stringify(true) },
  ]

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  console.log('Created default settings')

  // Create sample time entries for testing
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const lastWeek = new Date(today)
  lastWeek.setDate(lastWeek.getDate() - 7)

  const sampleEntries = [
    // Today's entries for user1
    {
      user_id: user1.id,
      start_utc: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9:00
      end_utc: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12:00
      duration_minutes: 180,
      category: Category.REGULAR,
      note: 'Vormittagsarbeit',
      project_tag: 'Projekt A',
      created_by: user1.id,
    },
    {
      user_id: user1.id,
      start_utc: new Date(today.getTime() + 13 * 60 * 60 * 1000), // 13:00
      end_utc: new Date(today.getTime() + 17 * 60 * 60 * 1000), // 17:00
      duration_minutes: 240,
      category: Category.REGULAR,
      note: 'Nachmittagsarbeit',
      project_tag: 'Projekt A',
      created_by: user1.id,
    },
    // Yesterday's entries for user1
    {
      user_id: user1.id,
      start_utc: new Date(yesterday.getTime() + 8 * 60 * 60 * 1000), // 8:00
      end_utc: new Date(yesterday.getTime() + 16 * 60 * 60 * 1000), // 16:00
      duration_minutes: 480,
      category: 'REGULAR',
      note: 'Voller Arbeitstag',
      project_tag: 'Projekt B',
      created_by: user1.id,
    },
    // Last week's entries for user1
    {
      user_id: user1.id,
      start_utc: new Date(lastWeek.getTime() + 9 * 60 * 60 * 1000), // 9:00
      end_utc: new Date(lastWeek.getTime() + 15 * 60 * 60 * 1000), // 15:00
      duration_minutes: 360,
      category: 'REGULAR',
      note: 'Wochenarbeiten',
      project_tag: 'Projekt C',
      created_by: user1.id,
    },
  ]

  for (const entry of sampleEntries) {
    await prisma.timeEntry.create({
      data: entry,
    })
  }

  console.log('Created sample time entries')
  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
