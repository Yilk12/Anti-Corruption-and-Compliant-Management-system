export default function SettingsIndexPage() {
  if (typeof window !== "undefined") {
    window.location.href = "/admin/settings/general"
  }
  return null
}


