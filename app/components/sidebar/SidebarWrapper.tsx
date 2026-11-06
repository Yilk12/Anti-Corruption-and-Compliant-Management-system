"use client";
import React from "react";
import { Home } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";
import { useLocalization } from "@/app/hooks/use-localization";

export type SidebarWrapperProps = {
  children: React.ReactNode;
  onBackToSidebar?: () => void;
  className?: string;
  onMessagesClick?: () => void;
  onAboutClick?: () => void;
  onLanguagesClick?: () => void;
};

export default function SidebarWrapper({ children, onBackToSidebar, className, onMessagesClick, onAboutClick, onLanguagesClick }: SidebarWrapperProps) {
  const { t } = useLocalization();
  return (
    <div className={`relative h-full w-64 bg-gray-100 shadow-lg p-4 ${className ?? ""}`}>
      <div className="absolute top-2 right-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBackToSidebar}
          className="rounded-full hover:bg-gray-200"
          aria-label={t("sidebar.back_to_main")}
        >
          <Home className="h-5 w-5" />
        </Button>
      </div>
      <div className="mt-10">
        {children}
      </div>
    </div>
  );
}
