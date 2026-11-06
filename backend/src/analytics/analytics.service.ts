import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { UserRole } from "../common/enums/user-role.enum"

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardOverview(userRole?: UserRole, userId?: string) {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // User metrics
    const [totalUsers, activeUsers] = await Promise.all([
      userRole === UserRole.ADMIN || userRole === UserRole.Commissioner ? this.prisma.user.count() : 0,
      userRole === UserRole.ADMIN || userRole === UserRole.Commissioner
        ? this.prisma.user.count({ where: { isActive: true } })
        : 0,
    ])

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
      },
    }
  }

  async getTicketAnalytics(startDate?: Date, endDate?: Date, userRole?: UserRole, userId?: string) {
    // Ticket analytics removed - help desk module deleted
    return {
      byStatus: {},
      byPriority: {},
      byCategory: {},
      byDepartment: {},
      dailyTrend: [],
      resolutionTimes: [],
      slaCompliance: { total: 0, compliant: 0, breached: 0, byPriority: {} },
    }
  }

  async getKnowledgeBaseAnalytics(startDate?: Date, endDate?: Date, userRole?: UserRole, userId?: string) {
    // Knowledge base analytics removed - knowledge base module deleted
    return {
      byStatus: {},
      byLanguage: {},
      byCategory: {},
      viewTrends: [],
      topArticles: [],
      engagementMetrics: { totalViews: 0, totalLikes: 0, totalDislikes: 0, totalComments: 0, avgViewsPerArticle: 0, engagementRate: 0 },
    }
  }

  async getUserAnalytics() {
    const [byUserType, byDepartment, registrationTrend, activityMetrics] = await Promise.all([
      this.prisma.user.groupBy({
        by: ["userType"],
        _count: { userType: true },
      }),
      this.prisma.user.groupBy({
        by: ["departmentId"],
        where: { departmentId: { not: null } },
        _count: { departmentId: true },
      }),
      this.getUserRegistrationTrend(),
      this.getUserActivityMetrics(),
    ])

    return {
      byRole: [],
      byUserType: this.formatGroupByResults(byUserType, "userType"),
      byDepartment: this.formatGroupByResults(byDepartment, "departmentId"),
      registrationTrend,
      activityMetrics,
    }
  }

  private async getUserRegistrationTrend() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const users = await this.prisma.user.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
      },
    })

    const dailyData: { [key: string]: number } = {}

    users.forEach((user) => {
      const date = user.createdAt.toISOString().split("T")[0]
      dailyData[date] = (dailyData[date] || 0) + 1
    })

    return Object.entries(dailyData).map(([date, count]) => ({
      date,
      count,
    }))
  }

  private async getUserActivityMetrics() {
    return {
      activeTicketCreators: 0,
      activeArticleAuthors: 0,
      activeCommenters: 0,
    }
  }

  private formatGroupByResults(results: any[], field: string) {
    return results.reduce((acc, item) => {
      acc[item[field]] = item._count[field]
      return acc
    }, {})
  }
}
