import { Module } from '@nestjs/common';
import { EthicsService } from './ethics.service';
import { EthicsController } from './ethics.controller';
import { InvestigationsController } from './investigations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [EthicsController, InvestigationsController],
  providers: [EthicsService],
  exports: [EthicsService],
})
export class EthicsModule {}
