import { Module } from "@nestjs/common"
import { PrismaModule } from "../prisma/prisma.module"
import { DepartmentsService } from "./departments.service"
import { DepartmentsController } from "./departments.controller"

@Module({
  imports: [PrismaModule],
  providers: [DepartmentsService],
  controllers: [DepartmentsController],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
