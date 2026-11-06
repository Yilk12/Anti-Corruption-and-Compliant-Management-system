import React from "react"
import dynamic from "next/dynamic"

const RequestForm = dynamic(() => import("@/app/components/request-form"), { ssr: false })

export default function DepartmentHeadPage() {
  return (
    <main style={{ padding: 20, display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 1000 }}>
        <h2 style={{ marginTop: 0 }}></h2>
        {/* Request form only shown for department heads (component does role detection) */}
        <RequestForm />
        {/* ...other department head content... */}
      </div>
    </main>
  )
}
