"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import VerticalNavigation from "@/app/components/sidebar/vertical-navigation";
import { useIsMobile } from "@/app/hooks/use-mobile";

export default function SidebarContainer() {
  const pathname = usePathname();
  const onAuthPages =
    pathname === "/login" || pathname?.startsWith("/login/") ||
    pathname === "/register" || pathname?.startsWith("/register/") ||
    pathname === "/forgot-password" || pathname?.startsWith("/forgot-password/");
  const onAboutPage = pathname === "/about" || pathname?.startsWith("/about/");
  const onGuestPages =
    pathname?.startsWith("/guest-feedback") ||
    pathname?.startsWith("/guest-anticorruption") ||
    pathname?.startsWith("/track-complaint") ||
    pathname?.startsWith("/track-feedback") ||
    pathname?.startsWith("/guest-complaint");

  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
    window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { collapsed: !collapsed } }));
  };

  // Currently we always show the main sidebar (except auth/about/guest pages), even on mobile,
  // so that header, sidebar, and workspace are visible together.
  if (onAuthPages || onAboutPage || onGuestPages) return null;

  if (collapsed) {
    return (
      <div
        style={{
          width: 50,
          flexShrink: 0,
          transition: "width 0.3s ease",
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
        }}
      >
      </div>
    );
  }

  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        transition: "width 0.3s ease",
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <VerticalNavigation />
      </div>
    </div>
  );
}
