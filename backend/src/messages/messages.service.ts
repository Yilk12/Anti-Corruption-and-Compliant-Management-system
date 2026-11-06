import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async getUnreadCount(userId: string) {
    try {
      const count = await (this.prisma as any).message.count({
        where: {
          toId: userId,
          NOT: {
            readBy: {
              has: userId,
            },
          },
        },
      });
      return { count };
    } catch (error) {
      console.error('Error getting unread count:', error);
      return { count: 0 };
    }
  }

  async getMessages(page: number = 1, pageSize: number = 10, from?: string, to?: string) {
    try {
      const skip = (page - 1) * pageSize;
      const where: any = {};

      // If both from and to are provided, get conversation between them
      if (from && to && from.trim() && to.trim()) {
        where.OR = [
          { fromId: from, toId: to },
          { fromId: to, toId: from },
        ];
      } else if (from && from.trim()) {
        // If only from is provided, get all messages sent by this user
        where.fromId = from;
      } else if (to && to.trim()) {
        // If only to is provided, get all messages received by this user
        where.toId = to;
      } else {
        // If no filters, return empty result
        return { items: [], total: 0, page, pageSize };
      }

      const [messages, total] = await Promise.all([
        (this.prisma as any).message.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            fromUser: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            toUser: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        }),
        (this.prisma as any).message.count({ where }),
      ]);

      const items = messages.map((m) => ({
        id: m.id,
        from: m.fromId,
        fromName: `${m.fromUser.firstName} ${m.fromUser.lastName}`.trim(),
        to: m.toId,
        toName: `${m.toUser.firstName} ${m.toUser.lastName}`.trim(),
        text: m.text,
        attachments: m.attachments || [],
        readBy: m.readBy,
        createdAt: m.createdAt,
      }));

      return { items, total, page, pageSize };
    } catch (error) {
      console.error('Error getting messages:', error);
      return { items: [], total: 0, page, pageSize };
    }
  }

  async sendMessage(from: string, to: string, text: string, attachments: string[] = []) {
    try {
      // Validate inputs
      if (!from || !to || !text || !from.trim() || !to.trim() || !text.trim()) {
        throw new Error('Invalid message data: from, to, and text are required');
      }

      const message = await (this.prisma as any).message.create({
        data: {
          fromId: from,
          toId: to,
          text,
          attachments,
          readBy: [],
        },
        include: {
          fromUser: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          toUser: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      return {
        id: message.id,
        from: message.fromId,
        fromName: `${message.fromUser.firstName} ${message.fromUser.lastName}`.trim(),
        to: message.toId,
        toName: `${message.toUser.firstName} ${message.toUser.lastName}`.trim(),
        text: message.text,
        attachments: message.attachments || [],
        readBy: message.readBy,
        createdAt: message.createdAt,
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async markAsRead(messageId: string, userId: string) {
    try {
      const message = await (this.prisma as any).message.update({
        where: { id: messageId },
        data: {
          readBy: {
            push: userId,
          },
        },
      });
      return { success: true };
    } catch (error) {
      console.error('Error marking message as read:', error);
      return { success: false };
    }
  }

  async markConversationAsRead(userId: string, otherUserId: string) {
    try {
      await (this.prisma as any).message.updateMany({
        where: {
          OR: [
            { fromId: otherUserId, toId: userId },
            { fromId: userId, toId: otherUserId },
          ],
          NOT: {
            readBy: {
              has: userId,
            },
          },
        },
        data: {
          readBy: {
            push: userId,
          },
        },
      });
      return { success: true };
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      return { success: false };
    }
  }
}
