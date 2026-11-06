import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { WorkflowService } from './workflow.service'
import { FieldOvertimeController } from './field-overtime.controller'

@Module({
  imports: [PrismaModule],
  controllers: [FieldOvertimeController],
  providers: [WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
