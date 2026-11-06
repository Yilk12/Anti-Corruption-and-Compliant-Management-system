import { Controller, Get, Query, UseGuards, Request, Res } from "@nestjs/common"
import { Response } from "express"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger"
import { ReportsService } from "./reports.service"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import { UserRole } from "../common/enums/user-role.enum"

@ApiTags("Reports")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: "Generate ticket report" })
  @Get("tickets")
  async generateTicketReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('format') format: 'json' | 'csv' = 'json',
    @Request() req,
    @Res() res: Response,
  ) {
    const report = await this.reportsService.generateTicketReport(
      new Date(startDate),
      new Date(endDate),
      format,
      req.user.role,
      req.user.userId,
    )

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv")
      res.setHeader("Content-Disposition", "attachment; filename=ticket-report.csv")
      return res.send(report)
    }

    return res.json(report)
  }

  @ApiOperation({ summary: "Generate knowledge base report" })
  @Get("knowledge-base")
  async generateKnowledgeBaseReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('format') format: 'json' | 'csv' = 'json',
    @Request() req,
    @Res() res: Response,
  ) {
    const report = await this.reportsService.generateKnowledgeBaseReport(
      new Date(startDate),
      new Date(endDate),
      format,
      req.user.role,
      req.user.userId,
    )

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv")
      res.setHeader("Content-Disposition", "attachment; filename=knowledge-base-report.csv")
      return res.send(report)
    }

    return res.json(report)
  }

  @ApiOperation({ summary: "Generate user report" })
  @Roles(UserRole.ADMIN, UserRole.Commissioner, UserRole.Department_Head)
  @Get("users")
  async generateUserReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('format') format: 'json' | 'csv' = 'json',
    @Res() res: Response,
  ) {
    const report = await this.reportsService.generateUserReport(new Date(startDate), new Date(endDate), format)

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv")
      res.setHeader("Content-Disposition", "attachment; filename=user-report.csv")
      return res.send(report)
    }

    return res.json(report)
  }

  @ApiOperation({ summary: "Generate performance report" })
  @Roles(UserRole.ADMIN, UserRole.Commissioner, UserRole.Department_Head)
  @Get("performance")
  async generatePerformanceReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('format') format: 'json' | 'csv' = 'json',
    @Res() res: Response,
  ) {
    const report = await this.reportsService.generatePerformanceReport(new Date(startDate), new Date(endDate), format)

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv")
      res.setHeader("Content-Disposition", "attachment; filename=performance-report.csv")
      return res.send(report)
    }

    return res.json(report)
  }
}
