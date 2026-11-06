import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding departments…")

  const departments = [
    { name: "Federal Civil Service Commission", nameAm: "ፌዴራል ሲቪል ሰርቪስ ኮሚሽን", description: "Federal Civil Service Commission", isActive: true },
    { name: "Human Resource Management", nameAm: "የሰው ሀብል አስተዳዳሪ", description: "Human Resource Management Department", isActive: true },
    { name: "Finance and Budget", nameAm: "ፋይናንስ እና በጀት", description: "Finance and Budget Department", isActive: true },
    { name: "Ethics and Anti-Corruption", nameAm: "ስርዓተ ስርዓት እና ሙስና መከላከያ", description: "Ethics and Anti-Corruption Department", isActive: true },
    { name: "Asset Management", nameAm: "የንብረት አስተዳዳሪ", description: "Asset Management Department", isActive: true },
    { name: "IT and Technology", nameAm: "አይቲ እና ቴክኖሎጂ", description: "IT and Technology Department", isActive: true },
    { name: "Legal Affairs", nameAm: "ህግ እና ህግ", description: "Legal Affairs Department", isActive: true },
    { name: "Planning and Monitoring", nameAm: "እቅድ እና ክትባት", description: "Planning and Monitoring Department", isActive: true },
    { name: "Administration", nameAm: "አስተዳዳሪ", description: "Administration Department", isActive: true },
    { name: "Public Relations", nameAm: "ይፋዊ ግንኙነት", description: "Public Relations Department", isActive: true },
  ]

  for (const dept of departments) {
    const existing = await prisma.department.findFirst({
      where: { name: { equals: dept.name, mode: 'insensitive' } }
    })

    if (existing) {
      await prisma.department.update({
        where: { id: existing.id },
        data: dept
      })
      console.log(`Updated: ${dept.name}`)
    } else {
      await prisma.department.create({
        data: dept
      })
      console.log(`Created: ${dept.name}`)
    }
  }

  console.log("Departments seeding complete.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
