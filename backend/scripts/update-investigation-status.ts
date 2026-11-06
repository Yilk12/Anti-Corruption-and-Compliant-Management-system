import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Updating investigation status from "Assigned" to "Under Investigation"...')

  // Update investigations with status "Assigned" to "Under Investigation"
  const updatedInvestigations = await prisma.investigation.updateMany({
    where: {
      status: 'Assigned',
    },
    data: {
      status: 'Under Investigation',
    },
  })

  console.log(`Updated ${updatedInvestigations.count} investigations`)

  // Update complaints with status "Assigned" to "Under Investigation"
  const updatedComplaints = await prisma.complaint.updateMany({
    where: {
      status: 'Assigned',
    },
    data: {
      status: 'Under Investigation',
    },
  })

  console.log(`Updated ${updatedComplaints.count} complaints`)

  console.log('Done!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
