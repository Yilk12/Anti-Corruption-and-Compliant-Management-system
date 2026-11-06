"use client";

import React from "react";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Hide footer on sexual-assault feedback pages to avoid overlaying charts/lists
  if (pathname && pathname.startsWith("/feedback/sexual-assault")) {
    return null;
  }

  return (
    <footer
      style={{
        width: "100%",
        background: "#111",
        color: "#bbb",
        borderTop: "1px solid #222",
        padding: "12px 16px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "0.9rem",
      }}
    >
      <span>© Copyright - ፌዴራል ሲቪል ሰርቪስ ኮሚሽን</span>
    </footer>
  );
}
