import { PrismaClient } from "@prisma/client"
import { UserRole } from "../common/enums/user-role.enum"
import { UserType } from "../common/enums/user-type.enum"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Deleting all users…")
  
  // Delete all users
  await prisma.user.deleteMany({})
  
  console.log("All users deleted.")
  console.log("Seeding demo users…")

  const passwordHash = await bcrypt.hash("admin@1234", 10)

  const admin = await prisma.user.create({
    data: {
      email: "admin@fcsc.com",
      firstName: "System",
      lastName: "Admin",
      roles: [UserRole.ADMIN],
      userType: UserType.INTERNAL,
      password: passwordHash,
      isActive: true,
      employeeId: "EMP-001",
    },
  })

  console.log(`Created: ${admin.email} (roles=${admin.roles}, type=${admin.userType}, employeeId=${admin.employeeId})`)
  console.log("Seeding complete.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
