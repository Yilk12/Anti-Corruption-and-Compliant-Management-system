import { Controller, Get, Patch, Param, Query, UseGuards, Request } from "@nestjs/common"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { NotificationService } from "../common/notification.service"

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  async getNotifications(@Request() req, @Query("page") page = 1, @Query("limit") limit = 10) {
    const userId = req.user?.userId || req.user?.id
    if (!userId) {
      return { notifications: [], pagination: { total: 0, page, limit, totalPages: 0 } }
    }
    return this.notificationService.getNotifications(userId, Number(page), Number(limit))
  }

  @Get("unread-count")
  async getUnreadCount(@Request() req) {
    const userId = req.user?.userId || req.user?.id
    if (!userId) {
      return { count: 0 }
    }
    const count = await this.notificationService.getUnreadCount(userId)
    return { count }
  }

  @Patch(":id/read")
  async markAsRead(@Param("id") id: string, @Request() req) {
    const userId = req.user?.userId || req.user?.id
    if (!userId) {
      return { success: false }
    }
    return this.notificationService.markAsRead(id, userId)
  }

  @Patch("read-all")
  async markAllAsRead(@Request() req) {
    const userId = req.user?.userId || req.user?.id
    if (!userId) {
      return { success: false }
    }
    return this.notificationService.markAllAsRead(userId)
  }
}
