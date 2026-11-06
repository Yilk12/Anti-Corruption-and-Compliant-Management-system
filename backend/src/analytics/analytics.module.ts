import { Module } from "@nestjs/common"
import { AnalyticsService } from "./analytics.service"
import { AnalyticsController } from "./analytics.controller"
import { ReportsService } from "./reports.service"
import { ReportsController } from "./reports.controller"
import { UsersModule } from "../users/users.module"

@Module({
  imports: [UsersModule],
  providers: [AnalyticsService, ReportsService],
  controllers: [AnalyticsController, ReportsController],
  exports: [AnalyticsService, ReportsService],
})
export class AnalyticsModule {}
