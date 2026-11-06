import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Assigning user to department…")

  const userEmail = "kt@gmail.com"
  
  // Find the user
  const user = await prisma.user.findUnique({
    where: { email: userEmail }
  })

  if (!user) {
    console.log(`User not found: ${userEmail}`)
    return
  }

  console.log(`Found user: ${user.firstName} ${user.lastName} (${user.email})`)
  console.log(`Current departmentId: ${user.departmentId}`)

  // Find a department to assign (use the first available department)
  const department = await prisma.department.findFirst({
    where: { isActive: true }
  })

  if (!department) {
    console.log("No active departments found. Please create a department first.")
    return
  }

  console.log(`Assigning to department: ${department.name} (ID: ${department.id})`)

  // Update the user with the department
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { departmentId: department.id }
  })

  console.log(`User updated successfully. New departmentId: ${updatedUser.departmentId}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
