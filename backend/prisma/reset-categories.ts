import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetCategories() {
  console.log('Starting categories and subcategories reset...')
  
  try {
    // Delete in order of dependencies (child tables first)
    console.log('Deleting AssetMaintenanceSchedule records...')
    await prisma.maintenanceSchedule.deleteMany({})
    
    console.log('Deleting Maintenance records...')
    await prisma.maintenance.deleteMany({})
    
    console.log('Deleting AssetDisposal records...')
    await prisma.assetDisposal.deleteMany({})
    
    console.log('Deleting DamageReport records...')
    await prisma.damageReport.deleteMany({})
    
    console.log('Deleting AssetReturn records...')
    await prisma.assetReturn.deleteMany({})
    
    console.log('Deleting AssetTransfer records...')
    await prisma.assetTransfer.deleteMany({})
    
    console.log('Deleting AssetHistory records...')
    await prisma.assetHistory.deleteMany({})
    
    console.log('Deleting AssetAssignment records...')
    await prisma.assetAssignment.deleteMany({})
    
    console.log('Deleting Asset records...')
    await prisma.asset.deleteMany({})
    
    console.log('Deleting AssetRequestApproval records...')
    await prisma.assetRequestApproval.deleteMany({})
    
    console.log('Deleting AssetRequestHistory records...')
    await prisma.assetRequestHistory.deleteMany({})
    
    console.log('Deleting AssetNotification records...')
    await prisma.assetNotification.deleteMany({})
    
    console.log('Deleting AssetRequest records...')
    await prisma.assetRequest.deleteMany({})
    
    console.log('Deleting AssetSubcategory records...')
    await prisma.assetSubcategory.deleteMany({})
    
    console.log('Deleting AssetCategory records...')
    await prisma.assetCategory.deleteMany({})
    
    console.log('✅ Categories, subcategories, and related asset data reset completed successfully!')
    console.log('Users, departments, and other data have been preserved.')
  } catch (error) {
    console.error('❌ Error during categories reset:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

resetCategories()
