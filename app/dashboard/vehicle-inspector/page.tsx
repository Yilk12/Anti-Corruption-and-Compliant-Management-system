"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Car, Clock, CheckCircle, AlertTriangle, Wrench } from "lucide-react"
import { getCurrentUserRoles } from "@/app/lib/auth"
import { DashboardLayout } from "@/app/components/dashboard-layout"

interface ReturnedVehicle {
  id: string
  assetId: string
  assetTag: string
  assetName: string
  category: string
  returnedBy: string
  returnedByName: string
  departmentId: string
  departmentName: string
  returnReason: string
  conditionAtReturn: string
  physicalInspection: string
  remarks: string
  verificationStatus: 'PENDING_INSPECTION' | 'INSPECTED' | 'OFFICER_APPROVED' | 'OFFICER_REJECTED' | 'APPROVED' | 'REJECTED'
  createdAt: string
  inspectionRemarks?: string
  // Vehicle-specific fields
  purchasePrice?: number
  plateNumber?: string
  make?: string
  model?: string
  year?: number
  chassisNumber?: string
  engineNumber?: string
  fuelType?: string
  cylinderCount?: number
  purchaseDate?: string
}

interface VehicleInspectionForm {
  // Section 1: Return Information
  vehiclePlateNo: string
  vehicleMakeModel: string
  driverName: string
  department: string
  returnDateTime: string
  inspector: string
  inspectionDateTime: string
  
  // Section 2: Odometer & Fuel Inspection
  odometerBefore: string
  odometerAtReturn: string
  odometerDifference: string
  fuelLevelBefore: string
  fuelLevelAtReturn: string
  fuelLevelDifference: string
  fuelCouponUsedBefore: string
  fuelCouponUsedAtReturn: string
  fuelCouponUsedDifference: string
  fuelReceiptAmountBefore: string
  fuelReceiptAmountAtReturn: string
  fuelReceiptAmountDifference: string
  
  // Section 3: Exterior Inspection
  exteriorInspections: {
    [key: string]: { condition: string; remarks: string }
  }
  
  // Section 4: Interior Inspection
  interiorInspections: {
    [key: string]: { condition: string; remarks: string }
  }
  
  // Section 5: Engine & Mechanical Inspection
  engineInspections: {
    [key: string]: { condition: string; remarks: string }
  }
  
  // Section 6: Safety Equipment Check
  safetyEquipment: {
    [key: string]: { status: string; remarks: string }
  }
  
  // Section 7: Vehicle Documents & Items Returned
  documentsItems: {
    [key: string]: { returned: boolean; missing: boolean; remarks: string }
  }
  
  // Section 8: New Damage / Incident
  newDamageIdentified: boolean
  damageDescription: string
  damageLocation: string
  damageSeverity: string
  accidentReported: boolean
  accidentReferenceNo: string
  
  // Section 9: Cleanliness & General Condition
  vehicleCleanliness: string
  overallVehicleCondition: string
  inspectorComments: string
  
  // Section 10: Return Inspection Decision
  inspectionDecision: string
}

export default function VehicleInspectorDashboard() {
  const router = useRouter()
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [returnedVehicles, setReturnedVehicles] = useState<ReturnedVehicle[]>([])
  const [showReturnedVehicles, setShowReturnedVehicles] = useState(false)
  const [loadingReturns, setLoadingReturns] = useState(false)
  const [pendingInspections, setPendingInspections] = useState(0)
  const [approvedInspections, setApprovedInspections] = useState(0)
  const [selectedVehicle, setSelectedVehicle] = useState<ReturnedVehicle | null>(null)
  const [showInspectionModal, setShowInspectionModal] = useState(false)
  const [inspectionRemarks, setInspectionRemarks] = useState('')
  const [submittingInspection, setSubmittingInspection] = useState(false)
  const [updatingVehicleId, setUpdatingVehicleId] = useState<string | null>(null)
  const [maintenanceRequestsCount, setMaintenanceRequestsCount] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [inspectionForm, setInspectionForm] = useState<VehicleInspectionForm>({
    // Section 1
    vehiclePlateNo: '',
    vehicleMakeModel: '',
    driverName: '',
    department: '',
    returnDateTime: '',
    inspector: '',
    inspectionDateTime: '',
    // Section 2
    odometerBefore: '',
    odometerAtReturn: '',
    odometerDifference: '',
    fuelLevelBefore: '',
    fuelLevelAtReturn: '',
    fuelLevelDifference: '',
    fuelCouponUsedBefore: '',
    fuelCouponUsedAtReturn: '',
    fuelCouponUsedDifference: '',
    fuelReceiptAmountBefore: '',
    fuelReceiptAmountAtReturn: '',
    fuelReceiptAmountDifference: '',
    // Section 3
    exteriorInspections: {
      frontBumper: { condition: 'Good', remarks: '' },
      rearBumper: { condition: 'Good', remarks: '' },
      frontLeftDoor: { condition: 'Good', remarks: '' },
      frontRightDoor: { condition: 'Good', remarks: '' },
      rearLeftDoor: { condition: 'Good', remarks: '' },
      rearRightDoor: { condition: 'Good', remarks: '' },
      hood: { condition: 'Good', remarks: '' },
      roof: { condition: 'Good', remarks: '' },
      trunkTailgate: { condition: 'Good', remarks: '' },
      frontWindshield: { condition: 'Good', remarks: '' },
      rearWindshield: { condition: 'Good', remarks: '' },
      sideMirrors: { condition: 'Good', remarks: '' },
      headlights: { condition: 'Good', remarks: '' },
      tailLights: { condition: 'Good', remarks: '' },
      turnSignals: { condition: 'Good', remarks: '' },
      tires: { condition: 'Good', remarks: '' },
      wheelsRims: { condition: 'Good', remarks: '' },
      licensePlate: { condition: 'Good', remarks: '' },
    },
    // Section 4
    interiorInspections: {
      driverSeat: { condition: 'Good', remarks: '' },
      passengerSeats: { condition: 'Good', remarks: '' },
      seatBelts: { condition: 'Good', remarks: '' },
      dashboard: { condition: 'Good', remarks: '' },
      steeringWheel: { condition: 'Good', remarks: '' },
      gearShift: { condition: 'Good', remarks: '' },
      airConditioning: { condition: 'Working', remarks: '' },
      radioAudio: { condition: 'Working', remarks: '' },
      horn: { condition: 'Working', remarks: '' },
      interiorLights: { condition: 'Working', remarks: '' },
      windows: { condition: 'Working', remarks: '' },
      doorLocks: { condition: 'Working', remarks: '' },
      interiorCleanliness: { condition: 'Clean', remarks: '' },
      floorCarpet: { condition: 'Good', remarks: '' },
    },
    // Section 5
    engineInspections: {
      engine: { condition: 'Good', remarks: '' },
      engineOil: { condition: 'Normal', remarks: '' },
      coolant: { condition: 'Normal', remarks: '' },
      brakeFluid: { condition: 'Normal', remarks: '' },
      battery: { condition: 'Good', remarks: '' },
      brakes: { condition: 'Good', remarks: '' },
      steering: { condition: 'Good', remarks: '' },
      suspension: { condition: 'Good', remarks: '' },
      transmissionGearbox: { condition: 'Good', remarks: '' },
      clutch: { condition: 'Good', remarks: '' },
      engineNoise: { condition: 'Normal', remarks: '' },
      oilLeakage: { condition: 'None', remarks: '' },
      coolantLeakage: { condition: 'None', remarks: '' },
      otherLeakage: { condition: 'None', remarks: '' },
    },
    // Section 6
    safetyEquipment: {
      fireExtinguisher: { status: 'Available', remarks: '' },
      firstAidKit: { status: 'Available', remarks: '' },
      warningTriangle: { status: 'Available', remarks: '' },
      jack: { status: 'Available', remarks: '' },
      wheelSpanner: { status: 'Available', remarks: '' },
      spareTire: { status: 'Available', remarks: '' },
      emergencyTools: { status: 'Available', remarks: '' },
      reflectiveVest: { status: 'Available', remarks: '' },
    },
    // Section 7
    documentsItems: {
      vehicleRegistration: { returned: false, missing: false, remarks: '' },
      insuranceDocument: { returned: false, missing: false, remarks: '' },
      vehicleKey: { returned: false, missing: false, remarks: '' },
      spareKey: { returned: false, missing: false, remarks: '' },
      fuelCoupon: { returned: false, missing: false, remarks: '' },
      gpsDevice: { returned: false, missing: false, remarks: '' },
      logbook: { returned: false, missing: false, remarks: '' },
      otherEquipment: { returned: false, missing: false, remarks: '' },
    },
    // Section 8
    newDamageIdentified: false,
    damageDescription: '',
    damageLocation: '',
    damageSeverity: '',
    accidentReported: false,
    accidentReferenceNo: '',
    // Section 9
    vehicleCleanliness: '',
    overallVehicleCondition: '',
    inspectorComments: '',
    // Section 10
    inspectionDecision: '',
  })
  const [activeSection, setActiveSection] = useState(1)
  const [userRoles, setUserRoles] = useState<string[]>([])

  useEffect(() => {
    setUserRoles(getCurrentUserRoles())
  }, [])

  async function fetchMaintenanceRequests() {
    if (!userId) return
    
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')
      const res = await fetch('/api/assets/maintenance', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      
      if (res.ok) {
        const data = await res.json()
        // Count maintenance requests assigned to this Vehicle Inspector
        const assignedCount = Array.isArray(data) 
          ? data.filter((req: any) => req.assignedTechnician === userId).length
          : 0
        setMaintenanceRequestsCount(assignedCount)
      }
    } catch (error) {
      console.error('Failed to fetch maintenance requests:', error)
    }
  }

  useEffect(() => {
    const access = userRoles.includes('vehicle_inspector') || userRoles.includes('admin')
    setHasAccess(access)

    // Get current user ID
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUserId(payload.sub || payload.userId || '')
      }
    } catch (error) {
      console.error('Error fetching user ID:', error)
    }

    setLoading(false)
    
    if (!access) {
      router.push('/dashboard')
    } else {
      fetchMaintenanceRequests()
    }
  }, [router, userRoles])

  async function fetchReturnedVehicles() {
    try {
      setLoadingReturns(true)
      const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')
      const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '')

      const res = await fetch(`${API_BASE}/api/assets/returns?category=VEH`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (res.ok) {
        const data = await res.json()
        console.log('Raw returned vehicles data:', data)
        
        const vehicles = (data.returns || data || []).map((item: any) => ({
          id: item.id,
          assetId: item.assetId,
          assetTag: item.asset?.assetTag || item.asset?.registrationNumber || '-',
          assetName: item.asset?.name || '-',
          category: typeof item.asset?.category === 'string' ? item.asset.category : item.asset?.category?.name || '-',
          returnedBy: item.returnedBy,
          returnedByName: item.returnedByUser ? 
            `${item.returnedByUser.firstName} ${item.returnedByUser.lastName}` : 
            'Unknown',
          departmentId: item.departmentId,
          departmentName: item.department?.name || '-',
          returnReason: item.returnReason || '-',
          conditionAtReturn: item.conditionAtReturn || '-',
          physicalInspection: item.physicalInspection || '',
          remarks: item.remarks || '',
          verificationStatus: item.verificationStatus || 'PENDING_INSPECTION',
          createdAt: item.returnDate || item.createdAt,
          inspectionRemarks: item.inspectionRemarks || '',
          // Vehicle-specific fields from asset specifications
          purchasePrice: item.asset?.purchasePrice || null,
          plateNumber: item.asset?.specifications?.plateNumber || item.asset?.registrationNumber || null,
          make: item.asset?.brand || item.asset?.specifications?.make || null,
          model: item.asset?.model || item.asset?.specifications?.model || null,
          year: item.asset?.specifications?.year || null,
          chassisNumber: item.asset?.specifications?.chassisNumber || null,
          engineNumber: item.asset?.specifications?.engineNumber || null,
          fuelType: item.asset?.specifications?.fuelType || null,
          cylinderCount: item.asset?.specifications?.cylinderCount || null,
          purchaseDate: item.asset?.purchaseDate || null,
        }))
        
        console.log('Mapped vehicles:', vehicles)
        setReturnedVehicles(vehicles)
        setPendingInspections(vehicles.filter((v: ReturnedVehicle) => v.verificationStatus === 'PENDING_INSPECTION').length)
        setApprovedInspections(vehicles.filter((v: ReturnedVehicle) => v.verificationStatus === 'APPROVED').length)
      }
    } catch (error) {
      console.error('Failed to fetch returned vehicles:', error)
    } finally {
      setLoadingReturns(false)
    }
  }

  const handleToggleReturnedVehicles = () => {
    if (!showReturnedVehicles && returnedVehicles.length === 0) {
      fetchReturnedVehicles()
    }
    setShowReturnedVehicles(!showReturnedVehicles)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_INSPECTION':
        return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING_INSPECTION':
        return 'Pending Inspection'
      case 'APPROVED':
        return 'Inspected'
      case 'REJECTED':
        return 'Inspected'
      default:
        return status
    }
  }

  const handleInspection = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedVehicle) return

    setSubmittingInspection(true)
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')
      const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '')

      // Vehicle inspector approves/rejects, status becomes INSPECTED for asset officer to review
      const res = await fetch(`${API_BASE}/api/assets/returns/${selectedVehicle.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          verificationStatus: 'INSPECTED',
          inspectionRemarks: inspectionForm.inspectorComments,
          inspectionData: inspectionForm,
        }),
      })

      if (res.ok) {
        // Close modal first
        setShowInspectionModal(false)
        setSelectedVehicle(null)
        resetInspectionForm()
        
        // Wait for modal to close before updating table
        setTimeout(async () => {
          await fetchReturnedVehicles()
        }, 200)
      } else {
        const errorData = await res.json()
        alert(errorData.error || 'Failed to update inspection status')
      }
    } catch (error) {
      console.error('Error updating inspection:', error)
      alert('Failed to update inspection status')
    } finally {
      setSubmittingInspection(false)
    }
  }

  const openInspectionModal = (vehicle: ReturnedVehicle) => {
    setSelectedVehicle(vehicle)
    setInspectionForm(prev => ({
      ...prev,
      vehiclePlateNo: vehicle.plateNumber || vehicle.assetTag,
      vehicleMakeModel: `${vehicle.make || ''} ${vehicle.model || ''}`.trim(),
      department: vehicle.departmentName,
      inspectionDateTime: new Date().toISOString().slice(0, 16),
    }))
    setActiveSection(1)
    setShowInspectionModal(true)
  }

  const resetInspectionForm = () => {
    setInspectionForm({
      vehiclePlateNo: '',
      vehicleMakeModel: '',
      driverName: '',
      department: '',
      returnDateTime: '',
      inspector: '',
      inspectionDateTime: '',
      odometerBefore: '',
      odometerAtReturn: '',
      odometerDifference: '',
      fuelLevelBefore: '',
      fuelLevelAtReturn: '',
      fuelLevelDifference: '',
      fuelCouponUsedBefore: '',
      fuelCouponUsedAtReturn: '',
      fuelCouponUsedDifference: '',
      fuelReceiptAmountBefore: '',
      fuelReceiptAmountAtReturn: '',
      fuelReceiptAmountDifference: '',
      exteriorInspections: {
        frontBumper: { condition: 'Good', remarks: '' },
        rearBumper: { condition: 'Good', remarks: '' },
        frontLeftDoor: { condition: 'Good', remarks: '' },
        frontRightDoor: { condition: 'Good', remarks: '' },
        rearLeftDoor: { condition: 'Good', remarks: '' },
        rearRightDoor: { condition: 'Good', remarks: '' },
        hood: { condition: 'Good', remarks: '' },
        roof: { condition: 'Good', remarks: '' },
        trunkTailgate: { condition: 'Good', remarks: '' },
        frontWindshield: { condition: 'Good', remarks: '' },
        rearWindshield: { condition: 'Good', remarks: '' },
        sideMirrors: { condition: 'Good', remarks: '' },
        headlights: { condition: 'Good', remarks: '' },
        tailLights: { condition: 'Good', remarks: '' },
        turnSignals: { condition: 'Good', remarks: '' },
        tires: { condition: 'Good', remarks: '' },
        wheelsRims: { condition: 'Good', remarks: '' },
        licensePlate: { condition: 'Good', remarks: '' },
      },
      interiorInspections: {
        driverSeat: { condition: 'Good', remarks: '' },
        passengerSeats: { condition: 'Good', remarks: '' },
        seatBelts: { condition: 'Good', remarks: '' },
        dashboard: { condition: 'Good', remarks: '' },
        steeringWheel: { condition: 'Good', remarks: '' },
        gearShift: { condition: 'Good', remarks: '' },
        airConditioning: { condition: 'Working', remarks: '' },
        radioAudio: { condition: 'Working', remarks: '' },
        horn: { condition: 'Working', remarks: '' },
        interiorLights: { condition: 'Working', remarks: '' },
        windows: { condition: 'Working', remarks: '' },
        doorLocks: { condition: 'Working', remarks: '' },
        interiorCleanliness: { condition: 'Clean', remarks: '' },
        floorCarpet: { condition: 'Good', remarks: '' },
      },
      engineInspections: {
        engine: { condition: 'Good', remarks: '' },
        engineOil: { condition: 'Normal', remarks: '' },
        coolant: { condition: 'Normal', remarks: '' },
        brakeFluid: { condition: 'Normal', remarks: '' },
        battery: { condition: 'Good', remarks: '' },
        brakes: { condition: 'Good', remarks: '' },
        steering: { condition: 'Good', remarks: '' },
        suspension: { condition: 'Good', remarks: '' },
        transmissionGearbox: { condition: 'Good', remarks: '' },
        clutch: { condition: 'Good', remarks: '' },
        engineNoise: { condition: 'Normal', remarks: '' },
        oilLeakage: { condition: 'None', remarks: '' },
        coolantLeakage: { condition: 'None', remarks: '' },
        otherLeakage: { condition: 'None', remarks: '' },
      },
      safetyEquipment: {
        fireExtinguisher: { status: 'Available', remarks: '' },
        firstAidKit: { status: 'Available', remarks: '' },
        warningTriangle: { status: 'Available', remarks: '' },
        jack: { status: 'Available', remarks: '' },
        wheelSpanner: { status: 'Available', remarks: '' },
        spareTire: { status: 'Available', remarks: '' },
        emergencyTools: { status: 'Available', remarks: '' },
        reflectiveVest: { status: 'Available', remarks: '' },
      },
      documentsItems: {
        vehicleRegistration: { returned: false, missing: false, remarks: '' },
        insuranceDocument: { returned: false, missing: false, remarks: '' },
        vehicleKey: { returned: false, missing: false, remarks: '' },
        spareKey: { returned: false, missing: false, remarks: '' },
        fuelCoupon: { returned: false, missing: false, remarks: '' },
        gpsDevice: { returned: false, missing: false, remarks: '' },
        logbook: { returned: false, missing: false, remarks: '' },
        otherEquipment: { returned: false, missing: false, remarks: '' },
      },
      newDamageIdentified: false,
      damageDescription: '',
      damageLocation: '',
      damageSeverity: '',
      accidentReported: false,
      accidentReferenceNo: '',
      vehicleCleanliness: '',
      overallVehicleCondition: '',
      inspectorComments: '',
      inspectionDecision: '',
    })
    setActiveSection(1)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pt-8 md:pt-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">
              Vehicle Inspector Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Inspect and verify returned vehicles
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-linear-to-br from-blue-50 to-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Returns</p>
                <p className="text-2xl font-bold">{returnedVehicles.length}</p>
              </div>
              <Car className="w-5 h-5 text-primary" />
            </div>
          </div>

          <div className="bg-linear-to-br from-yellow-50 to-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Inspection</p>
                <p className="text-2xl font-bold">{pendingInspections}</p>
              </div>
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>

          <div className="bg-linear-to-br from-green-50 to-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{approvedInspections}</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>

          <div className="bg-linear-to-br from-red-50 to-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">
                  {returnedVehicles.filter(v => v.verificationStatus === 'REJECTED').length}
                </p>
              </div>
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex gap-4">
          <button
            onClick={handleToggleReturnedVehicles}
            className="px-6 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 transition-all"
          >
            የተመለሰ መኪና (Returned Vehicles)
          </button>
          <button
            onClick={() => router.push('/assets/maintenance')}
            className="px-6 py-3 bg-linear-to-r from-orange-600 to-orange-700 text-white rounded-lg shadow-md hover:from-orange-700 hover:to-orange-800 transition-all"
          >
            የሚጠገን ንብረት (Maintenance Requests) ({maintenanceRequestsCount ?? 0})
          </button>
        </div>

        {/* Returned Vehicles Table */}
        {showReturnedVehicles && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold">Returned Vehicles History</h2>
            </div>
            
            {loadingReturns ? (
              <div className="p-6 text-center">Loading returned vehicles...</div>
            ) : returnedVehicles.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No returned vehicles found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purchase Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Asset Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plate Number
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Make
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Model
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chassis Number
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Engine Number
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fuel Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cylinder Count
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Condition
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purchase Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {returnedVehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {vehicle.purchasePrice ? `${vehicle.purchasePrice.toLocaleString()} ETB` : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {vehicle.assetName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {vehicle.plateNumber || vehicle.assetTag || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {vehicle.make || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {vehicle.model || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {vehicle.year || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {vehicle.chassisNumber || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {vehicle.engineNumber || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {vehicle.fuelType || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {vehicle.cylinderCount || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {vehicle.conditionAtReturn}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {vehicle.purchaseDate ? formatDate(vehicle.purchaseDate) : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button
                            onClick={() => openInspectionModal(vehicle)}
                            className={`px-3 py-1 rounded text-sm ${
                              vehicle.verificationStatus === 'APPROVED' || vehicle.verificationStatus === 'OFFICER_APPROVED'
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : vehicle.verificationStatus === 'REJECTED' || vehicle.verificationStatus === 'OFFICER_REJECTED'
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : vehicle.verificationStatus === 'INSPECTED'
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-600 text-white hover:bg-gray-700'
                            }`}
                          >
                            {vehicle.verificationStatus === 'APPROVED' ? 'Approved by all users' :
                             vehicle.verificationStatus === 'OFFICER_APPROVED' ? 'Approved by Officer' :
                             vehicle.verificationStatus === 'REJECTED' ? 'Rejected' :
                             vehicle.verificationStatus === 'OFFICER_REJECTED' ? 'Rejected by Officer' :
                             vehicle.verificationStatus === 'INSPECTED' ? 'Inspected' :
                             'Inspect Vehicle'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Inspection Modal */}
        {showInspectionModal && selectedVehicle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Vehicle Return Inspection Form</h3>
                  <button
                    onClick={() => {
                      setShowInspectionModal(false)
                      setSelectedVehicle(null)
                      resetInspectionForm()
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                {/* Section Navigation */}
                <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
                  {[1, 2, 3].map((section) => (
                    <button
                      key={section}
                      onClick={() => setActiveSection(section)}
                      className={`px-3 py-1 rounded text-sm ${
                        activeSection === section
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {section}
                    </button>
                  ))}
                </div>

                {/* Section 1: Return Information */}
                {activeSection === 1 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold border-b pb-2">1. Return Information</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Plate No.</label>
                        <input
                          type="text"
                          value={inspectionForm.vehiclePlateNo}
                          onChange={(e) => setInspectionForm({...inspectionForm, vehiclePlateNo: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Make/Model</label>
                        <input
                          type="text"
                          value={inspectionForm.vehicleMakeModel}
                          onChange={(e) => setInspectionForm({...inspectionForm, vehicleMakeModel: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                        <input
                          type="text"
                          value={inspectionForm.driverName}
                          onChange={(e) => setInspectionForm({...inspectionForm, driverName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <input
                          type="text"
                          value={inspectionForm.department}
                          onChange={(e) => setInspectionForm({...inspectionForm, department: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Return Date/Time</label>
                        <input
                          type="datetime-local"
                          value={inspectionForm.returnDateTime}
                          onChange={(e) => setInspectionForm({...inspectionForm, returnDateTime: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Inspector</label>
                        <input
                          type="text"
                          value={inspectionForm.inspector}
                          onChange={(e) => setInspectionForm({...inspectionForm, inspector: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Date/Time</label>
                        <input
                          type="datetime-local"
                          value={inspectionForm.inspectionDateTime}
                          onChange={(e) => setInspectionForm({...inspectionForm, inspectionDateTime: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 2: Vehicle Condition (Consolidated) */}
                {activeSection === 2 && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold border-b pb-2">2. Vehicle Condition</h4>
                    
                    {/* Exterior Inspection */}
                    <div>
                      <h5 className="font-medium mb-3 text-gray-700">Exterior Inspection</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border p-2 text-left">Inspection Item</th>
                              <th className="border p-2">Condition</th>
                              <th className="border p-2">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(inspectionForm.exteriorInspections).map(([key, value]) => (
                              <tr key={key}>
                                <td className="border p-2 font-medium capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </td>
                                <td className="border p-2">
                                  <select
                                    value={value.condition}
                                    onChange={(e) => setInspectionForm({
                                      ...inspectionForm,
                                      exteriorInspections: {
                                        ...inspectionForm.exteriorInspections,
                                        [key]: { ...value, condition: e.target.value }
                                      }
                                    })}
                                    className="w-full px-2 py-1 border rounded"
                                  >
                                    <option value="Good">Good</option>
                                    <option value="Minor Damage">Minor Damage</option>
                                    <option value="Major Damage">Major Damage</option>
                                    <option value="Damaged">Damaged</option>
                                    <option value="Worn/Damaged">Worn/Damaged</option>
                                  </select>
                                </td>
                                <td className="border p-2">
                                  <input
                                    type="text"
                                    value={value.remarks}
                                    onChange={(e) => setInspectionForm({
                                      ...inspectionForm,
                                      exteriorInspections: {
                                        ...inspectionForm.exteriorInspections,
                                        [key]: { ...value, remarks: e.target.value }
                                      }
                                    })}
                                    className="w-full px-2 py-1 border rounded"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Interior Inspection */}
                    <div>
                      <h5 className="font-medium mb-3 text-gray-700">Interior Inspection</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border p-2 text-left">Item</th>
                              <th className="border p-2">Condition</th>
                              <th className="border p-2">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(inspectionForm.interiorInspections).map(([key, value]) => (
                              <tr key={key}>
                                <td className="border p-2 font-medium capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </td>
                                <td className="border p-2">
                                  <select
                                    value={value.condition}
                                    onChange={(e) => setInspectionForm({
                                      ...inspectionForm,
                                      interiorInspections: {
                                        ...inspectionForm.interiorInspections,
                                        [key]: { ...value, condition: e.target.value }
                                      }
                                    })}
                                    className="w-full px-2 py-1 border rounded"
                                  >
                                    <option value="Good">Good</option>
                                    <option value="Damaged">Damaged</option>
                                    <option value="Working">Working</option>
                                    <option value="Not Working">Not Working</option>
                                    <option value="Clean">Clean</option>
                                    <option value="Dirty">Dirty</option>
                                  </select>
                                </td>
                                <td className="border p-2">
                                  <input
                                    type="text"
                                    value={value.remarks}
                                    onChange={(e) => setInspectionForm({
                                      ...inspectionForm,
                                      interiorInspections: {
                                        ...inspectionForm.interiorInspections,
                                        [key]: { ...value, remarks: e.target.value }
                                      }
                                    })}
                                    className="w-full px-2 py-1 border rounded"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Engine & Mechanical Inspection */}
                    <div>
                      <h5 className="font-medium mb-3 text-gray-700">Engine & Mechanical Inspection</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border p-2 text-left">Item</th>
                              <th className="border p-2">Condition</th>
                              <th className="border p-2">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(inspectionForm.engineInspections).map(([key, value]) => (
                              <tr key={key}>
                                <td className="border p-2 font-medium capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </td>
                                <td className="border p-2">
                                  <select
                                    value={value.condition}
                                    onChange={(e) => setInspectionForm({
                                      ...inspectionForm,
                                      engineInspections: {
                                        ...inspectionForm.engineInspections,
                                        [key]: { ...value, condition: e.target.value }
                                      }
                                    })}
                                    className="w-full px-2 py-1 border rounded"
                                  >
                                    <option value="Good">Good</option>
                                    <option value="Problem">Problem</option>
                                    <option value="Normal">Normal</option>
                                    <option value="Low">Low</option>
                                    <option value="Weak">Weak</option>
                                    <option value="None">None</option>
                                    <option value="Detected">Detected</option>
                                    <option value="Abnormal">Abnormal</option>
                                  </select>
                                </td>
                                <td className="border p-2">
                                  <input
                                    type="text"
                                    value={value.remarks}
                                    onChange={(e) => setInspectionForm({
                                      ...inspectionForm,
                                      engineInspections: {
                                        ...inspectionForm.engineInspections,
                                        [key]: { ...value, remarks: e.target.value }
                                      }
                                    })}
                                    className="w-full px-2 py-1 border rounded"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Safety Equipment Check */}
                    <div>
                      <h5 className="font-medium mb-3 text-gray-700">Safety Equipment Check</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border p-2 text-left">Equipment</th>
                              <th className="border p-2">Status</th>
                              <th className="border p-2">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(inspectionForm.safetyEquipment).map(([key, value]) => (
                              <tr key={key}>
                                <td className="border p-2 font-medium capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </td>
                                <td className="border p-2">
                                  <select
                                    value={value.status}
                                    onChange={(e) => setInspectionForm({
                                      ...inspectionForm,
                                      safetyEquipment: {
                                        ...inspectionForm.safetyEquipment,
                                        [key]: { ...value, status: e.target.value }
                                      }
                                    })}
                                    className="w-full px-2 py-1 border rounded"
                                  >
                                    <option value="Available">Available</option>
                                    <option value="Missing">Missing</option>
                                    <option value="Missing/Damaged">Missing/Damaged</option>
                                  </select>
                                </td>
                                <td className="border p-2">
                                  <input
                                    type="text"
                                    value={value.remarks}
                                    onChange={(e) => setInspectionForm({
                                      ...inspectionForm,
                                      safetyEquipment: {
                                        ...inspectionForm.safetyEquipment,
                                        [key]: { ...value, remarks: e.target.value }
                                      }
                                    })}
                                    className="w-full px-2 py-1 border rounded"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Vehicle Documents & Items Returned */}
                    <div>
                      <h5 className="font-medium mb-3 text-gray-700">Vehicle Documents & Items Returned</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border p-2 text-left">Item</th>
                              <th className="border p-2">Returned</th>
                              <th className="border p-2">Missing</th>
                              <th className="border p-2">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(inspectionForm.documentsItems).map(([key, value]) => (
                              <tr key={key}>
                                <td className="border p-2 font-medium capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </td>
                                <td className="border p-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={value.returned}
                                    onChange={(e) => setInspectionForm({
                                      ...inspectionForm,
                                      documentsItems: {
                                        ...inspectionForm.documentsItems,
                                        [key]: { ...value, returned: e.target.checked }
                                      }
                                    })}
                                    className="w-4 h-4"
                                  />
                                </td>
                                <td className="border p-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={value.missing}
                                    onChange={(e) => setInspectionForm({
                                      ...inspectionForm,
                                      documentsItems: {
                                        ...inspectionForm.documentsItems,
                                        [key]: { ...value, missing: e.target.checked }
                                      }
                                    })}
                                    className="w-4 h-4"
                                  />
                                </td>
                                <td className="border p-2">
                                  <input
                                    type="text"
                                    value={value.remarks}
                                    onChange={(e) => setInspectionForm({
                                      ...inspectionForm,
                                      documentsItems: {
                                        ...inspectionForm.documentsItems,
                                        [key]: { ...value, remarks: e.target.value }
                                      }
                                    })}
                                    className="w-full px-2 py-1 border rounded"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* New Damage / Incident */}
                    <div>
                      <h5 className="font-medium mb-3 text-gray-700">New Damage / Incident</h5>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Was any new damage identified?
                          </label>
                          <div className="flex gap-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                checked={!inspectionForm.newDamageIdentified}
                                onChange={() => setInspectionForm({...inspectionForm, newDamageIdentified: false})}
                                className="mr-2"
                              />
                              No
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                checked={inspectionForm.newDamageIdentified}
                                onChange={() => setInspectionForm({...inspectionForm, newDamageIdentified: true})}
                                className="mr-2"
                              />
                              Yes
                            </label>
                          </div>
                        </div>

                        {inspectionForm.newDamageIdentified && (
                          <div className="space-y-4 pl-4 border-l-4 border-blue-500">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Damage Description</label>
                              <textarea
                                value={inspectionForm.damageDescription}
                                onChange={(e) => setInspectionForm({...inspectionForm, damageDescription: e.target.value})}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Location of Damage</label>
                              <input
                                type="text"
                                value={inspectionForm.damageLocation}
                                onChange={(e) => setInspectionForm({...inspectionForm, damageLocation: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Severity</label>
                              <div className="flex flex-wrap gap-4">
                                {['Minor', 'Moderate', 'Major', 'Critical'].map((severity) => (
                                  <label key={severity} className="flex items-center">
                                    <input
                                      type="radio"
                                      checked={inspectionForm.damageSeverity === severity}
                                      onChange={() => setInspectionForm({...inspectionForm, damageSeverity: severity})}
                                      className="mr-2"
                                    />
                                    {severity}
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Was an accident reported?</label>
                              <div className="flex gap-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    checked={!inspectionForm.accidentReported}
                                    onChange={() => setInspectionForm({...inspectionForm, accidentReported: false})}
                                    className="mr-2"
                                  />
                                  No
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    checked={inspectionForm.accidentReported}
                                    onChange={() => setInspectionForm({...inspectionForm, accidentReported: true})}
                                    className="mr-2"
                                  />
                                  Yes
                                </label>
                              </div>
                            </div>
                            {inspectionForm.accidentReported && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Accident/Incident Reference No.</label>
                                <input
                                  type="text"
                                  value={inspectionForm.accidentReferenceNo}
                                  onChange={(e) => setInspectionForm({...inspectionForm, accidentReferenceNo: e.target.value})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cleanliness & General Condition */}
                    <div>
                      <h5 className="font-medium mb-3 text-gray-700">Cleanliness & General Condition</h5>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle cleanliness</label>
                          <div className="flex flex-wrap gap-4">
                            {['Excellent', 'Good', 'Acceptable', 'Poor'].map((level) => (
                              <label key={level} className="flex items-center">
                                <input
                                  type="radio"
                                  checked={inspectionForm.vehicleCleanliness === level}
                                  onChange={() => setInspectionForm({...inspectionForm, vehicleCleanliness: level})}
                                  className="mr-2"
                                />
                                {level}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Overall vehicle condition</label>
                          <div className="flex flex-wrap gap-4">
                            {['Excellent', 'Good', 'Fair', 'Poor', 'Requires Maintenance', 'Requires Major Repair'].map((condition) => (
                              <label key={condition} className="flex items-center">
                                <input
                                  type="radio"
                                  checked={inspectionForm.overallVehicleCondition === condition}
                                  onChange={() => setInspectionForm({...inspectionForm, overallVehicleCondition: condition})}
                                  className="mr-2"
                                />
                                {condition}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Inspector's Comments</label>
                          <textarea
                            value={inspectionForm.inspectorComments}
                            onChange={(e) => setInspectionForm({...inspectionForm, inspectorComments: e.target.value})}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                            placeholder="Enter detailed comments..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 3: Return Inspection Decision */}
                {activeSection === 3 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold border-b pb-2">3. Return Inspection Decision</h4>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <label className="flex items-start p-4 border rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            checked={inspectionForm.inspectionDecision === 'APPROVED_READY_FOR_SERVICE'}
                            onChange={() => setInspectionForm({...inspectionForm, inspectionDecision: 'APPROVED_READY_FOR_SERVICE'})}
                            className="mt-1 mr-3"
                          />
                          <div>
                            <p className="font-semibold">A. Return to Service</p>
                            <p className="text-sm text-gray-600">Vehicle is safe and ready for the next assignment.</p>
                          </div>
                        </label>
                        <label className="flex items-start p-4 border rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            checked={inspectionForm.inspectionDecision === 'MAINTENANCE_REQUIRED'}
                            onChange={() => setInspectionForm({...inspectionForm, inspectionDecision: 'MAINTENANCE_REQUIRED'})}
                            className="mt-1 mr-3"
                          />
                          <div>
                            <p className="font-semibold">B. Minor Maintenance</p>
                            <p className="text-sm text-gray-600">Vehicle can be scheduled for normal maintenance.</p>
                          </div>
                        </label>
                        <label className="flex items-start p-4 border rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            checked={inspectionForm.inspectionDecision === 'MAJOR_REPAIR_REQUIRED'}
                            onChange={() => setInspectionForm({...inspectionForm, inspectionDecision: 'MAJOR_REPAIR_REQUIRED'})}
                            className="mt-1 mr-3"
                          />
                          <div>
                            <p className="font-semibold">C. Major Repair</p>
                            <p className="text-sm text-gray-600">Vehicle should not be assigned until repaired.</p>
                          </div>
                        </label>
                        <label className="flex items-start p-4 border rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            checked={inspectionForm.inspectionDecision === 'FURTHER_INSPECTION_REQUIRED'}
                            onChange={() => setInspectionForm({...inspectionForm, inspectionDecision: 'FURTHER_INSPECTION_REQUIRED'})}
                            className="mt-1 mr-3"
                          />
                          <div>
                            <p className="font-semibold">D. Further Inspection</p>
                            <p className="text-sm text-gray-600">Additional technical inspection is required.</p>
                          </div>
                        </label>
                        <label className="flex items-start p-4 border rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            checked={inspectionForm.inspectionDecision === 'INVESTIGATION_REQUIRED'}
                            onChange={() => setInspectionForm({...inspectionForm, inspectionDecision: 'INVESTIGATION_REQUIRED'})}
                            className="mt-1 mr-3"
                          />
                          <div>
                            <p className="font-semibold">E. Accident/Damage Investigation</p>
                            <p className="text-sm text-gray-600">Vehicle requires incident/damage investigation.</p>
                          </div>
                        </label>
                        <label className="flex items-start p-4 border rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            checked={inspectionForm.inspectionDecision === 'OUT_OF_SERVICE'}
                            onChange={() => setInspectionForm({...inspectionForm, inspectionDecision: 'OUT_OF_SERVICE'})}
                            className="mt-1 mr-3"
                          />
                          <div>
                            <p className="font-semibold">F. Out of Service</p>
                            <p className="text-sm text-gray-600">Vehicle should be temporarily removed from service.</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t">
                  <button
                    onClick={() => setActiveSection(Math.max(1, activeSection - 1))}
                    disabled={activeSection === 1}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setActiveSection(Math.min(3, activeSection + 1))}
                    disabled={activeSection === 3}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {activeSection === 3 ? 'Review' : 'Next'}
                  </button>
                </div>

                {/* Submit Buttons - Only show on section 3 */}
                {activeSection === 3 && (
                  <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
                    <button
                      onClick={() => {
                        setShowInspectionModal(false)
                        setSelectedVehicle(null)
                        resetInspectionForm()
                      }}
                      disabled={submittingInspection}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleInspection('REJECTED')}
                      disabled={submittingInspection || !inspectionForm.inspectionDecision}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleInspection('APPROVED')}
                      disabled={submittingInspection || !inspectionForm.inspectionDecision}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Approve
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
