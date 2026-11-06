import { PrismaClient } from "@prisma/client"
import { UserRole } from "../common/enums/user-role.enum"
import { UserType } from "../common/enums/user-type.enum"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function upsertUser(params: {
  email: string
  firstName: string
  lastName: string
  role: UserRole
  userType: UserType
  password: string
  departmentId?: string | null
  employeeId?: string | null
}) {
  const { email, firstName, lastName, role, userType, password, departmentId, employeeId } = params
  const passwordHash = await bcrypt.hash(password, 10)
  
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })
  
  if (existingUser) {
    // Update existing user without changing employeeId to avoid unique constraint violation
    return prisma.user.update({
      where: { email },
      data: {
        firstName,
        lastName,
        roles: [role],
        userType,
        departmentId: departmentId ?? null,
        password: passwordHash,
        isActive: true,
      } as any,
    })
  }
  
  // Create new user
  return prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      roles: [role],
      userType,
      departmentId: departmentId ?? null,
      employeeId: employeeId ?? null,
      password: passwordHash,
      isActive: true,
    } as any,
  })
}

async function main() {
  console.log("Seeding demo users…")

  const users = [
    {
      email: "admin@fcsc.com",
      firstName: "System",
      lastName: "Admin",
      role: UserRole.ADMIN,
      userType: UserType.INTERNAL,
      departmentId: null,
      password: "admin@1234",
      employeeId: "EMP-001",
    },
  ]

  for (const u of users) {
    const saved = await upsertUser({
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      userType: u.userType,
      departmentId: u.departmentId,
      password: u.password,
      employeeId: u.employeeId,
    })
    console.log(`Upserted: ${saved.email} (roles=${(saved as any).roles}, type=${saved.userType}, employeeId=${saved.employeeId})`)
  }

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
