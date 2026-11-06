"use client"

import React, { useState } from "react"
import { useLocalization } from "@/app/hooks/use-localization"

type SubmissionType = "COMPLAINT" | "SUGGESTION"

export default function SubmissionsPage() {
  const { t } = useLocalization()
  const [form, setForm] = useState({
    type: "COMPLAINT" as SubmissionType,
    subject: "",
    description: "",
    submitterName: "",
    submitterDepartment: "",
    contactEmail: "",
    contactPhone: "",
    anonymous: false,
  })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string>("")

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as any
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg("")
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || `Submit failed: ${res.status}`)
      }
      setMsg(t("submissions.success"))
      setForm({
        type: "COMPLAINT",
        subject: "",
        description: "",
        submitterName: "",
        submitterDepartment: "",
        contactEmail: "",
        contactPhone: "",
        anonymous: false,
      })
    } catch (err: any) {
      setMsg(err?.message || t("submissions.failed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-4">{t("submissions.title")}</h1>
        <p className="text-sm text-gray-600 mb-6">{t("submissions.subtitle")}</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t("submissions.type")}</label>
              <select
                name="type"
                value={form.type}
                onChange={onChange}
                className="w-full border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="COMPLAINT">{t("submissions.type.complaint")}</option>
                <option value="SUGGESTION">{t("submissions.type.suggestion")}</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  name="anonymous"
                  checked={form.anonymous}
                  onChange={onChange}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-700">{t("submissions.anonymous")}</span>
              </label>
            </div>
          </div>

          {!form.anonymous && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t("submissions.name")}</label>
                <input
                  type="text"
                  name="submitterName"
                  value={form.submitterName}
                  onChange={onChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t("submissions.department")}</label>
                <input
                  type="text"
                  name="submitterDepartment"
                  value={form.submitterDepartment}
                  onChange={onChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t("submissions.email")}</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={form.contactEmail}
                  onChange={onChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t("submissions.phone")}</label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={form.contactPhone}
                  onChange={onChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-600 mb-1">{t("submissions.subject")}</label>
            <input
              type="text"
              name="subject"
              value={form.subject}
              onChange={onChange}
              required
              maxLength={200}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">{t("submissions.description")}</label>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              required
              maxLength={5000}
              rows={6}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-md transition border border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
            >
              {loading ? "..." : t("submissions.submit")}
            </button>
          </div>
        </form>

        {msg && <p className="mt-4 text-sm text-center">{msg}</p>}
      </div>
    </div>
  )
}
