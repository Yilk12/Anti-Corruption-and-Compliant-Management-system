import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Assigning all users without departments to a default department…")

  // Find a default department to assign
  const defaultDepartment = await prisma.department.findFirst({
    where: { isActive: true }
  })

  if (!defaultDepartment) {
    console.log("No active departments found. Please create a department first.")
    return
  }

  console.log(`Using default department: ${defaultDepartment.name} (ID: ${defaultDepartment.id})`)

  // Find all users without a department
  const usersWithoutDepartment = await prisma.user.findMany({
    where: { departmentId: null }
  })

  console.log(`Found ${usersWithoutDepartment.length} users without a department`)

  if (usersWithoutDepartment.length === 0) {
    console.log("All users already have a department assigned.")
    return
  }

  // Update all users without a department
  let updatedCount = 0
  for (const user of usersWithoutDepartment) {
    await prisma.user.update({
      where: { id: user.id },
      data: { departmentId: defaultDepartment.id }
    })
    console.log(`Updated user: ${user.firstName} ${user.lastName} (${user.email})`)
    updatedCount++
  }

  console.log(`Successfully updated ${updatedCount} users.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
