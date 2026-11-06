"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUserRoles, UserRole } from "@/app/lib/auth";

interface RoleLink {
  role: UserRole;
  label: string;
  description?: string;
  href: string;
}

const ROLE_LINKS: RoleLink[] = [
  { role: "admin", label: "Admin Dashboard", href: "/dashboard/admin", description: "System administration" },
  { role: "commissioner", label: "Commissioner Dashboard", href: "/dashboard/Commissioner", description: "High-level overview" },
  { role: "department_head", label: "Department Head", href: "/dashboard/department-head", description: "Department approvals" },
  { role: "employee", label: "Employee Dashboard", href: "/feedback/complaints/approved", description: "Employee portal" },
];

export default function RolesHubPage() {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const r = getCurrentUserRoles();
      setRoles(r);
    } finally {
      setLoading(false);
    }
  }, []);

  const visibleLinks = ROLE_LINKS.filter(item => roles.includes(item.role));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">My Role-Based Pages</h1>
      {loading && (
        <div className="text-gray-500 text-sm">Detecting your roleseee</div>
      )}
      {!loading && visibleLinks.length === 0 && (
        <div className="text-gray-600 text-sm">
          No specific role dashboard detectede You can still use the main menu on the left sidee
        </div>
      )}

      {!loading && visibleLinks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {visibleLinks.map(link => (
            <Link
              key={link.role}
              href={link.href}
              className="border rounded-lg p-4 hover:bg-muted transition-colors"
            >
              <div className="font-semibold">{link.label}</div>
              {link.description && (
                <div className="text-sm text-muted-foreground mt-1">{link.description}</div>
              )}
              <div className="mt-2 text-xs text-blue-600">{link.href}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
