import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Checking user department assignment…")

  const userEmail = "kt@gmail.com"
  
  // Find the user with department relation
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      department: {
        select: {
          id: true,
          name: true,
          nameAm: true,
        }
      }
    }
  })

  if (!user) {
    console.log(`User not found: ${userEmail}`)
    return
  }

  console.log(`User: ${user.firstName} ${user.lastName} (${user.email})`)
  console.log(`Department ID: ${user.departmentId}`)
  console.log(`Department Name: ${user.department?.name || 'None'}`)
  console.log(`Department Name (Amharic): ${user.department?.nameAm || 'None'}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
