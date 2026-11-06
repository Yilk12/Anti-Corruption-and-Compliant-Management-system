"use client"
import React, { useEffect, useState } from "react"

type Role = "driver" | "department_head" | "other"
type ReqType = "report" | "fuel" | "maintenance"

export default function RequestForm() {
  const [role, setRole] = useState<Role | null>(null)
  const [type, setType] = useState<ReqType>("report")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [vehicleId, setVehicleId] = useState("")
  const [amount, setAmount] = useState<string>("") // for fuel
  const [preferredDate, setPreferredDate] = useState<string>("") // for maintenance
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored =
      (localStorage.getItem("userRole") || sessionStorage.getItem("userRole") || "").toLowerCase()
    if (stored.includes("driver")) setRole("driver")
    else if (stored.includes("head") || stored.includes("department")) setRole("department_head")
    else setRole(null)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)

    const payload: Record<string, unknown> = {
      role: role ?? "other",
      type,
      subject,
      description,
      vehicleId: vehicleId || undefined,
      amount: amount ? Number(amount) : undefined,
      preferredDate: preferredDate || undefined,
    }

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Submit failed")
      setMessage("Request submitted.")
      // reset some fields
      setSubject("")
      setDescription("")
      setAmount("")
      setPreferredDate("")
      setVehicleId("")
    } catch (err: any) {
      setMessage(err?.message || "Error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: 760, background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <h3 style={{ marginTop: 0 }}>Submit Request</h3>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* role selector if unknown */}
        {role ? (
          <div style={{ color: "#374151", fontSize: 13 }}>Submitting as: <strong style={{ marginLeft: 6 }}>{role}</strong></div>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ minWidth: 110 }}>Role</label>
            <select value={role ?? ""} onChange={e => setRole(e.target.value as Role)} required>
              <option value="">Select role</option>
              <option value="driver">Driver</option>
              <option value="department_head">Department Head</option>
            </select>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ minWidth: 110 }}>Request type</label>
          <select value={type} onChange={e => setType(e.target.value as ReqType)}>
            <option value="report">Report issues</option>
            <option value="fuel">Fuel request</option>
            <option value="maintenance">Maintenance request</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ minWidth: 110 }}>Subject</label>
          <input value={subject} onChange={e => setSubject(e.target.value)} required style={{ flex: 1 }} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <label style={{ minWidth: 110, alignSelf: "flex-start" }}>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ flex: 1 }} />
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ minWidth: 110 }}>Vehicle ID</label>
          <input value={vehicleId} onChange={e => setVehicleId(e.target.value)} placeholder="optional" style={{ flex: 1 }} />
        </div>

        {type === "fuel" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ minWidth: 110 }}>Fuel amount</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="liters" inputMode="numeric" style={{ width: 160 }} />
          </div>
        )}

        {type === "maintenance" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ minWidth: 110 }}>Preferred date</label>
            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              style={{ width: 192 }}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
          <button type="submit" disabled={loading} style={{ padding: "8px 12px" }}>
            {loading ? "Sending..." : "Send"}
          </button>
        </div>

        {message && <div style={{ color: "#374151", marginTop: 6 }}>{message}</div>}
      </form>
    </div>
  )
}
