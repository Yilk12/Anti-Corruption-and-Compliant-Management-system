import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { LocalizationService } from "./localization.service"
import { Language } from "../common/enums/language.enum"

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private localizationService: LocalizationService,
  ) {}

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
    language: Language = Language.EN,
  ) {
    return this.prisma.userNotification.create({
      data: {
        userId,
        message: this.localizationService.translate(message, language),
        isRead: false,
      },
    })
  }

  async getNotifications(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit

    const [notifications, total] = await Promise.all([
      this.prisma.userNotification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.userNotification.count({ where: { userId } }),
    ])

    return {
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.userNotification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    })
  }

  async markAllAsRead(userId: string) {
    return this.prisma.userNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.userNotification.count({
      where: { userId, isRead: false },
    })
  }

  async deleteNotification(notificationId: string, userId: string) {
    return this.prisma.userNotification.deleteMany({
      where: { id: notificationId, userId },
    })
  }

  async deleteOldNotifications(daysOld = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    return this.prisma.userNotification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true,
      },
    })
  }
}
