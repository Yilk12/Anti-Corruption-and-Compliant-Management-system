"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Card, CardContent } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { useEffect, useState } from "react"
import SettingsPanel from "@/app/components/settings-panel"
import { getCurrentUserRoles } from "@/app/lib/auth"

const getVisibleSections = () => {
  try {
    const roles = getCurrentUserRoles().map((r) => String(r).toLowerCase())
    const isAdmin = roles.includes("admin")
    if (isAdmin) {
      return [
        { label: "Users & Roles", href: "/admin/settings/users" },
        { label: "Accounts", href: "/admin/settings/accounts" },
        { label: "Security", href: "/admin/settings/security" },
      ]
    }
  } catch {}
  return [
    { label: "Security", href: "/admin/settings/security" },
  ]
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sections, setSections] = useState<{ label: string; href: string }[]>([])

  useEffect(() => {
    setSections(getVisibleSections())
  }, [])

  return (
    <div className="flex flex-col h-screen">
      {pathname !== "/admin/settings/security" && (
        <header className="flex items-center justify-end bg-transparent shadow-none px-6 py-4">
        </header>
      )}

      <nav className="flex bg-blue-600 text-white px-6 py-3 shadow-sm">
        {sections.map((sec) => {
          const isActive = pathname?.startsWith(sec.href)
          return (
            <Link
              key={sec.href}
              href={sec.href}
              className={`mr-4 px-4 py-2 rounded-lg transition ${
                isActive ? "bg-white text-blue-600 font-semibold" : "hover:bg-blue-500"
              }`}
            >
              {sec.label}
            </Link>
          )
        })}
      </nav>

      <main className="flex-1 p-6 overflow-y-auto">
        <Card className="mb-6 bg-transparent shadow-none">
          <CardContent className="pt-6">
            {children}
          </CardContent>
        </Card>
        <div className="flex gap-4">
          <Button className="bg-blue-600 text-white hover:bg-blue-700">Save Changes</Button>
          <Button variant="outline">Reset</Button>
        </div>
      </main>
    </div>
  )
}


