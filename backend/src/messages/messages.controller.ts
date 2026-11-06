import { Controller, Get, Post, Body, Query, Request, UseGuards, Patch, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { MessagesService } from "./messages.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread message count for current user' })
  async getUnreadCount(@Request() req) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    if (!userId) {
      return { count: 0 };
    }
    return this.messagesService.getUnreadCount(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get messages between users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  async getMessages(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.messagesService.getMessages(page, pageSize, from, to);
  }

  @Post()
  @ApiOperation({ summary: 'Send a message' })
  async sendMessage(@Body() body: { from: string; to: string; text: string; attachments?: string[] }) {
    return this.messagesService.sendMessage(body.from, body.to, body.text, body.attachments || []);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a message as read' })
  async markAsRead(@Param('id') id: string, @Request() req) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    if (!userId) {
      return { success: false };
    }
    return this.messagesService.markAsRead(id, userId);
  }

  @Post('mark-conversation-read')
  @ApiOperation({ summary: 'Mark all messages in a conversation as read' })
  async markConversationAsRead(@Body() body: { otherUserId: string }, @Request() req) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    if (!userId) {
      return { success: false };
    }
    return this.messagesService.markConversationAsRead(userId, body.otherUserId);
  }
}
