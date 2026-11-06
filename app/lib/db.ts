import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient | null = null

export function getPrisma(): PrismaClient | null {
  if (process.env.USE_DB !== '1') return null
  try {
    if (!prisma) prisma = new PrismaClient()
    return prisma
  } catch {
    return null
  }
}
