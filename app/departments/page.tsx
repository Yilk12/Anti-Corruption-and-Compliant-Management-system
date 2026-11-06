import { DashboardLayout } from "@/app/components/dashboard-layout"
import { DepartmentManagement } from "@/app/components/department-management"

export default function DepartmentsPage() {
  return (
    <DashboardLayout showHeading={false}>
      <div className="w-full">
        <DepartmentManagement />
      </div>
    </DashboardLayout>
  )
}
