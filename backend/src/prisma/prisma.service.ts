import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  scorecard: any;
  kPI: any;
  kpiDataPoint: any;
  objective: any;
  conversation: any;
  conversationParticipant: any;
  messageReadReceipt: any;
  notification: any;
  feedback: any;
  searchQuery: any;
  searchInteraction: any;
  post: any;
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
