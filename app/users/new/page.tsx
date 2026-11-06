"use client"

import Link from "next/link"
import { Suspense } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Separator } from "@/app/components/ui/separator"
import { UserForm } from "@/app/components/user-form"
import { DashboardLayout } from "@/app/components/dashboard-layout"
import { ArrowLeft, UserPlus } from "lucide-react"

function NewUserPageInner() {
  const router = useRouter()
  return (
    <DashboardLayout showHeading={false}>
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-[2000px] px-2 md:px-4 py-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserPlus className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-primary">Add New User</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/users">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Users
                </Button>
              </Link>
            </div>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>User Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <UserForm onClose={() => { router.push("/users") }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function NewUserPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-600">Loading user form...</div>}>
      <NewUserPageInner />
    </Suspense>
  )
}
