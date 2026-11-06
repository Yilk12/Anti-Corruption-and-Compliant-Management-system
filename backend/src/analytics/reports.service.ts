import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { UserRole } from "../common/enums/user-role.enum"

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async generateTicketReport(
    startDate: Date,
    endDate: Date,
    format: "json" | "csv" = "json",
    userRole?: UserRole,
    userId?: string,
  ) {
    // Ticket report removed - help desk module deleted
    return {
      data: [],
      summary: {
        total: 0,
        byStatus: {},
        byPriority: {},
        byCategory: {},
        avgResolutionTime: 0,
        slaCompliance: 0,
      },
    }
  }

  async generateKnowledgeBaseReport(
    startDate: Date,
    endDate: Date,
    format: "json" | "csv" = "json",
    userRole?: UserRole,
    userId?: string,
  ) {
    // Knowledge base report removed - knowledge base module deleted
    return {
      data: [],
      summary: {
        total: 0,
        byStatus: {},
        byLanguage: {},
        totalViews: 0,
        totalLikes: 0,
        avgEngagement: 0,
      },
    }
  }

  async generateUserReport(startDate: Date, endDate: Date, format: "json" | "csv" = "json") {
    const users: any[] = await this.prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        department: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const reportData = users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roles: user.roles,
      userType: user.userType,
      department: user.department?.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
    }))

    if (format === "csv") {
      return this.convertToCSV(reportData)
    }

    return {
      data: reportData,
      summary: {
        total: users.length,
        byUserType: this.groupBy(users, "userType"),
        active: users.filter((u) => u.isActive).length,
        inactive: users.filter((u) => !u.isActive).length,
      },
    }
  }

  async generatePerformanceReport(startDate: Date, endDate: Date, format: "json" | "csv" = "json") {
    // Performance report removed - help desk module deleted
    return {
      data: [],
      summary: {
        totalAgents: 0,
        avgResolutionRate: 0,
        avgSlaCompliance: 0,
      },
    }
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return ""

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            // Escape commas and quotes in CSV
            if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          })
          .join(","),
      ),
    ].join("\n")

    return csvContent
  }

  private groupBy(array: any[], field: string) {
    return array.reduce((acc, item) => {
      const key = item[field]
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
  }
}
