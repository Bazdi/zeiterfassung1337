import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
  // Best-effort: enable WAL mode for better dev concurrency
  void db.$executeRawUnsafe('PRAGMA journal_mode=WAL;').catch(() => {})
}
