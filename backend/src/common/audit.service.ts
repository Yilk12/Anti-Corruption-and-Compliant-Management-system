import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logAction(action: string, entity: string, entityId: string, userId?: string, oldValues?: any, newValues?: any) {
    // Audit log removed - help desk module deleted
    return null
  }

  async getAuditLogs(entityType?: string, entityId?: string, userId?: string, page = 1, limit = 50) {
    // Audit log removed - help desk module deleted
    return {
      logs: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
    }
  }

  async getEntityHistory(entityType: string, entityId: string) {
    // Audit log removed - help desk module deleted
    return []
  }

  async getUserActivity(userId: string, days = 30) {
    // Audit log removed - help desk module deleted
    return []
  }

  async getSystemActivity(days = 7) {
    // Audit log removed - help desk module deleted
    return {
      totalActions: 0,
      actionsByType: {},
      actionsByUser: {},
      recentActions: [],
    }
  }
}
