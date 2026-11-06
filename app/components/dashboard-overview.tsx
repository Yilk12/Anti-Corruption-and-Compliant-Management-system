"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Ticket, Clock, CheckCircle, AlertCircle, TrendingUp, Plus } from "lucide-react"
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts"

export function DashboardOverview() {
  const router = useRouter();
  const [language] = useState<"en" | "am">("en")

  const stats = [
    {
      title: language === "en" ? "Total Tickets" : "ጠቅላላ ቲኬቶች",
      value: "1,234",
      change: "+12%",
      icon: Ticket,
      color: "text-primary",
    },
    {
      title: language === "en" ? "Open Tickets" : "ክፍት ቲኬቶች",
      value: "89",
      change: "-5%",
      icon: AlertCircle,
      color: "text-destructive",
    },
    {
      title: language === "en" ? "Resolved Today" : "ዛሬ የተፈቱ",
      value: "23",
      change: "+8%",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: language === "en" ? "Avg Response Time" : "አማካይ ምላሽ ጊዜ",
      value: "2.4h",
      change: "-15%",
      icon: Clock,
      color: "text-secondary",
    },
  ]

  // Chart data
  const ticketsSeries = [
    { month: "Jan", opened: 40, resolved: 32 },
    { month: "Feb", opened: 36, resolved: 28 },
    { month: "Mar", opened: 48, resolved: 41 },
    { month: "Apr", opened: 42, resolved: 39 },
    { month: "May", opened: 55, resolved: 50 },
  ]

  const kbSeries = [
    { label: "Articles", value: 156 },
    { label: "Active Users", value: 2341 },
    { label: "Searches", value: 89 },
  ]

  // Extra modules
  const fieldOvertimeSeries = [
    { week: "W1", field: 12, overtime: 6 },
    { week: "W2", field: 15, overtime: 8 },
    { week: "W3", field: 11, overtime: 5 },
    { week: "W4", field: 18, overtime: 9 },
  ]

  // Unified All-Modules dataset (uses latest point from each series and key totals)
  const latestTickets = ticketsSeries[ticketsSeries.length - 1]
  const latestField = fieldOvertimeSeries[fieldOvertimeSeries.length - 1]
  const allModulesData = [
    { label: "Tickets Opened", value: latestTickets.opened },
    { label: "Tickets Resolved", value: latestTickets.resolved },
    { label: "KB Articles", value: kbSeries.find(k=>k.label==="Articles")?.value ?? 0 },
    { label: "KB Searches", value: kbSeries.find(k=>k.label==="Searches")?.value ?? 0 },
    { label: "Field Tasks", value: latestField.field },
    { label: "Overtime Hrs", value: latestField.overtime },
  ]

  

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {/* Header icon and titles removed as per requirement */}
          {/* Tagline removed */}
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          {language === "en" ? "New Ticket" : "አዲስ ቲኬት"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stat.change.startsWith("+") ? "text-green-600" : "text-red-600"}>{stat.change}</span>{" "}
                {language === "en" ? "from last month" : "ከላለፈው ወር"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* All Modules Overview (single chart) */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {language === "en" ? "All Modules Overview" : "ሁሉም ሞጁሎች አጠቃላይ"}
            </CardTitle>
            <CardDescription>
              {language === "en" ? "Key metrics across modules" : "ከሞጁሎች ዋና መለኪያዎች"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={allModulesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" interval={0} angle={-20} textAnchor="end" height={70} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
  )
}
