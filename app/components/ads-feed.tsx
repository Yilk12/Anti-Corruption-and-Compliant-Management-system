"use client"
import React, { useEffect, useState } from "react"

type Ad = {
  id: string
  title: string
  content: string
  creator?: string
  createdAt: string
}

export default function AdsFeed() {
  const [ads, setAds] = useState<Ad[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"feed" | "archive">("feed")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [creator, setCreator] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const storedRole =
      (localStorage.getItem("userRole") || sessionStorage.getItem("userRole") || "").toLowerCase()
    const storedName = (localStorage.getItem("userName") || sessionStorage.getItem("userName") || "").toString()
    setCreator(storedName || null)
  }, [])

  useEffect(() => {
    fetchAds()
  }, [])

  async function fetchAds() {
    setLoading(true)
    try {
      const res = await fetch("/api/ads")
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
      setAds(Array.isArray(data) ? data : [])
    } catch {
      setAds([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (!title.trim() || !content.trim()) {
      setMessage("Title and content are required")
      return
    }
    try {
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim(), creator }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Create failed")
      setTitle("")
      setContent("")
      setMessage("Saved")
      // prepend new ad locally
      setAds(prev => (prev ? [data, ...prev] : [data]))
    } catch (err: any) {
      setMessage(err?.message || "Error")
    }
  }

  // show recent = last 30 days; archive are older
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  const visible = (ads || []).filter(a => {
    const t = Date.parse(a.createdAt || "")
    if (Number.isNaN(t)) return false
    return mode === "feed" ? t >= cutoff : t < cutoff
  })

  return (
    <div style={{ width: "100%", maxWidth: 900, background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Advertisements</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setMode("feed")} style={{ padding: "6px 10px", background: mode === "feed" ? "#111827" : "#f3f4f6", color: mode === "feed" ? "#fff" : "#111827", border: "none", borderRadius: 6 }}>
            Feed
          </button>
          <button onClick={() => setMode("archive")} style={{ padding: "6px 10px", background: mode === "archive" ? "#111827" : "#f3f4f6", color: mode === "archive" ? "#fff" : "#111827", border: "none", borderRadius: 6 }}>
            Archive
          </button>
        </div>
      </div>

      {/* create form (visible to creators) */}
      <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} style={{ padding: 8, borderRadius: 6, border: "1px solid #e5e7eb" }} />
        <textarea placeholder="Content" value={content} onChange={e => setContent(e.target.value)} rows={3} style={{ padding: 8, borderRadius: 6, border: "1px solid #e5e7eb" }} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="submit" style={{ padding: "8px 12px" }}>Create</button>
          <button type="button" onClick={() => { setTitle(""); setContent(""); setMessage(null) }} style={{ padding: "8px 12px" }}>Clear</button>
        </div>
        {message && <div style={{ color: "#374151" }}>{message}</div>}
      </form>

      <div>
        {loading && <div style={{ color: "#6b7280" }}>Loading...</div>}
        {!loading && visible.length === 0 && <div style={{ color: "#6b7280" }}>No advertisements found for this mode.</div>}
        {!loading && visible.map(a => (
          <article key={a.id} style={{ borderTop: "1px solid #f3f4f6", paddingTop: 12, marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h4 style={{ margin: 0 }}>{a.title}</h4>
              <small style={{ color: "#6b7280" }}>{new Date(a.createdAt).toLocaleString()}</small>
            </div>
            <div style={{ marginTop: 8, color: "#374151" }}>{a.content}</div>
            {a.creator && <div style={{ marginTop: 8, fontSize: 13, color: "#6b7280" }}>By: {a.creator}</div>}
          </article>
        ))}
      </div>
    </div>
  )
}
