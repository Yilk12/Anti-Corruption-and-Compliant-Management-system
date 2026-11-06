import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Deleting demo users…")

  const demoUsers = [
    "commissioner@example.com",
    "department.head@example.com",
    "agent@example.com",
    "support.it@example.com",
    "employee.it@example.com",
    "head.it@example.com",
    "announcement@example.com",
    "user.internal@example.com",
    "user.external@example.com",
  ]

  for (const email of demoUsers) {
    try {
      const deleted = await prisma.user.delete({
        where: { email }
      })
      console.log(`Deleted: ${deleted.email}`)
    } catch (error: any) {
      if (error.code === 'P2025') {
        console.log(`User not found (already deleted): ${email}`)
      } else {
        console.error(`Error deleting ${email}:`, error)
      }
    }
  }

  console.log("Demo users deletion complete.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
