"use client"

import { useState } from "react"
import { DashboardLayout } from "@/app/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"
import { Download, TrendingUp, TrendingDown, Users, Ticket, BookOpen, Clock, MessageSquare, BarChart3 } from "lucide-react"
import { useLocalization } from "@/app/hooks/use-localization"

const ticketData = [
  { month: "Jan", created: 45, resolved: 42, pending: 8 },
  { month: "Feb", created: 52, resolved: 48, pending: 12 },
  { month: "Mar", created: 38, resolved: 41, pending: 9 },
  { month: "Apr", created: 61, resolved: 55, pending: 15 },
  { month: "May", created: 49, resolved: 52, pending: 12 },
  { month: "Jun", created: 67, resolved: 59, pending: 20 },
]

const departmentData = [
  { name: "HR", tickets: 156, color: "#0891b2" },
  { name: "IT", tickets: 89, color: "#f59e0b" },
  { name: "Legal", tickets: 45, color: "#8b5cf6" },
  { name: "Operations", tickets: 78, color: "#ef4444" },
  { name: "Support", tickets: 92, color: "#6366f1" },
]

const kbData = [
  { month: "Jan", views: 1250, articles: 45, searches: 890 },
  { month: "Feb", views: 1380, articles: 48, searches: 920 },
  { month: "Mar", views: 1520, articles: 52, searches: 1100 },
  { month: "Apr", views: 1680, articles: 55, searches: 1250 },
  { month: "May", views: 1890, articles: 58, searches: 1380 },
  { month: "Jun", views: 2100, articles: 62, searches: 1520 },
]

export default function AnalyticsPage() {
  const { t, currentLanguage } = useLocalization()
  const [timeRange, setTimeRange] = useState("6months")

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t("analytics")}</h1>
            <p className="text-gray-600 mt-1">{t("analyticsDescription")}</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">{t("lastMonth")}</SelectItem>
                <SelectItem value="3months">{t("last3Months")}</SelectItem>
                <SelectItem value="6months">{t("last6Months")}</SelectItem>
                <SelectItem value="1year">{t("lastYear")}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {t("exportReport")}
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalTickets")}</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +12% {t("fromLastMonth")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("avgResolutionTime")}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.4h</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
                -8% {t("fromLastMonth")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("kbViews")}</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12.5K</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +24% {t("fromLastMonth")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("activeUsers")}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">892</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +5% {t("fromLastMonth")}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tickets" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tickets">{t("ticketAnalytics")}</TabsTrigger>
            <TabsTrigger value="knowledge">{t("knowledgeBaseAnalytics")}</TabsTrigger>
            <TabsTrigger value="performance">{t("performanceMetrics")}</TabsTrigger>
            <TabsTrigger value="sla">{t("slaReports")}</TabsTrigger>
            <TabsTrigger value="modules">Analytics & Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("ticketTrends")}</CardTitle>
                  <CardDescription>{t("ticketTrendsDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={ticketData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="created"
                        stackId="1"
                        stroke="#0891b2"
                        fill="#0891b2"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="resolved"
                        stackId="2"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="pending"
                        stackId="3"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("ticketsByDepartment")}</CardTitle>
                  <CardDescription>{t("departmentDistribution")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={departmentData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="tickets"
                        label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        {departmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("knowledgeBaseMetrics")}</CardTitle>
                <CardDescription>{t("kbUsageAndGrowth")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={kbData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="views" stroke="#0891b2" strokeWidth={2} />
                    <Line type="monotone" dataKey="searches" stroke="#f59e0b" strokeWidth={2} />
                    <Line type="monotone" dataKey="articles" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("agentPerformance")}</CardTitle>
                  <CardDescription>{t("topPerformingAgents")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: "Almaz Tadesse", resolved: 45, rating: 4.8 },
                      { name: "Dawit Bekele", resolved: 42, rating: 4.7 },
                      { name: "Hanan Mohammed", resolved: 38, rating: 4.6 },
                      { name: "Yonas Girma", resolved: 35, rating: 4.5 },
                    ].map((agent, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-sm text-gray-600">
                            {agent.resolved} {t("ticketsResolved")}
                          </p>
                        </div>
                        <Badge variant="secondary">{agent.rating} ⭐</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("responseTimeMetrics")}</CardTitle>
                  <CardDescription>{t("averageResponseTimes")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t("firstResponse")}</span>
                      <span className="text-sm">15 {t("minutes")}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t("resolution")}</span>
                      <span className="text-sm">2.4 {t("hours")}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t("customerSatisfaction")}</span>
                      <span className="text-sm">94%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sla" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("slaCompliance")}</CardTitle>
                <CardDescription>{t("slaPerformanceByPriority")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { priority: t("critical"), target: "1h", actual: "45m", compliance: 95 },
                    { priority: t("priority.high"), target: "4h", actual: "3.2h", compliance: 88 },
                    { priority: t("priority.medium"), target: "24h", actual: "18h", compliance: 92 },
                    { priority: t("priority.low"), target: "72h", actual: "48h", compliance: 96 },
                  ].map((sla, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Badge variant={sla.compliance >= 90 ? "default" : "destructive"}>{sla.priority}</Badge>
                        <div>
                          <p className="text-sm font-medium">
                            {t("target")}: {sla.target}
                          </p>
                          <p className="text-sm text-gray-600">
                            {t("actual")}: {sla.actual}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{sla.compliance}%</p>
                        <p className="text-sm text-gray-600">{t("compliance")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Modules overview */}
          <TabsContent value="modules" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Tickets */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tickets</CardTitle>
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    +12% from last month
                  </p>
                </CardContent>
              </Card>

              {/* Knowledge Base */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Knowledge Base</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12.5K</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    +24% views
                  </p>
                </CardContent>
              </Card>

              {/* Feedback */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Feedback</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">342</div>
                  <p className="text-xs text-muted-foreground">Avg rating 4.6</p>
                </CardContent>
              </Card>

              {/* Users */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">892</div>
                  <p className="text-xs text-muted-foreground">Active this month</p>
                </CardContent>
              </Card>

              {/* Planning/Reports */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reports</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">76</div>
                  <p className="text-xs text-muted-foreground">Submitted this quarter</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
