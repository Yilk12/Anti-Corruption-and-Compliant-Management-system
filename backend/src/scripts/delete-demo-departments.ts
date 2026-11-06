import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Deleting demo departments…")

  const demoDepartments = [
    "Federal Civil Service Commission",
    "Human Resource Management",
    "Finance and Budget",
    "Ethics and Anti-Corruption",
    "Asset Management",
    "IT and Technology",
    "Legal Affairs",
    "Planning and Monitoring",
    "Administration",
    "Public Relations",
  ]

  for (const deptName of demoDepartments) {
    const deleted = await prisma.department.deleteMany({
      where: { name: { equals: deptName, mode: 'insensitive' } }
    })

    if (deleted.count > 0) {
      console.log(`Deleted: ${deptName} (${deleted.count} records)`)
    } else {
      console.log(`Not found: ${deptName}`)
    }
  }

  console.log("Demo departments deletion complete.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
