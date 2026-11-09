import { Controller, Get, Param, Query, Request, UseGuards, Post, Patch, UseInterceptors, UploadedFiles, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from "@nestjs/swagger";
import { EthicsService } from "./ethics.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { FilesInterceptor } from "@nestjs/platform-express";

@ApiTags('Ethics Investigations')
@ApiBearerAuth()
@Controller('ethics/investigations')
export class InvestigationsController {
  constructor(private readonly ethicsService: EthicsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all ethics investigations' })
  @ApiResponse({ status: 200, description: 'List of investigations' })
  async findAllInvestigations(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Query('overdue') overdue?: string,
    @Query('bypassUserFilter') bypassUserFilter?: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.userId || req?.user?.id || req?.user?.sub;
    const userRoles = req?.user?.roles || [];
    const isEthicsOfficer = userRoles.includes('Ethics_Officer') || userRoles.includes('ethics_officer');
    const isEthicsAntiCorruption = userRoles.includes('Ethics_Anti_Corruption') || userRoles.includes('ethics_anti_corruption');
    const isInvestigator = isEthicsOfficer || isEthicsAntiCorruption;
    return this.ethicsService.findAllInvestigations({
      status,
      category,
      priority,
      search,
      overdue: overdue === 'true',
      bypassUserFilter: bypassUserFilter === 'true',
      userId,
      isInvestigator,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get investigation by ID' })
  @ApiResponse({ status: 200, description: 'Investigation details' })
  async findInvestigationById(@Param('id') id: string) {
    return this.ethicsService.findInvestigationById(id);
  }

  @Post(':id/evidence/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  @ApiOperation({ summary: 'Upload evidence files' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  async uploadEvidenceFiles(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('evidenceData') evidenceDataString: string,
  ) {
    const evidenceData = evidenceDataString ? JSON.parse(evidenceDataString) : {};
    return this.ethicsService.uploadEvidenceFiles(id, files, evidenceData);
  }

  @Post(':id/allegations')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Save allegations for investigation' })
  @ApiResponse({ status: 201, description: 'Allegations saved successfully' })
  async saveAllegations(@Param('id') id: string, @Body() body: { allegations: any[] }) {
    return this.ethicsService.saveAllegations(id, body.allegations);
  }

  @Post(':id/evidence-batch')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Save evidence batch for investigation' })
  @ApiResponse({ status: 201, description: 'Evidence saved successfully' })
  async saveEvidenceBatch(@Param('id') id: string, @Body() body: { evidenceRecords: any[] }) {
    return this.ethicsService.saveEvidenceBatch(id, body.evidenceRecords);
  }

  @Post(':id/findings')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Save findings for investigation' })
  @ApiResponse({ status: 201, description: 'Findings saved successfully' })
  async saveFindings(@Param('id') id: string, @Body() body: { findingsRecords: any[] }) {
    return this.ethicsService.saveFindings(id, body.findingsRecords);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update investigation' })
  @ApiResponse({ status: 200, description: 'Investigation updated successfully' })
  async updateInvestigation(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.ethicsService.updateInvestigation(id, body, userId);
  }

  @Post(':id/review')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Review and approve investigation' })
  @ApiResponse({ status: 200, description: 'Investigation reviewed successfully' })
  async reviewInvestigation(
    @Param('id') id: string,
    @Body() body: {
      reviewerName: string;
      findings: string;
      recommendation: string;
      decision: string;
      outcome: string;
    },
    @Request() req
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.ethicsService.reviewInvestigation(id, body, userId);
  }

  @Post(':id/close')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Close investigation case' })
  @ApiResponse({ status: 200, description: 'Investigation closed successfully' })
  async closeInvestigation(
    @Param('id') id: string,
    @Body() body: {
      responseMessage: string;
      followUpActions: string;
    },
    @Request() req
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.ethicsService.closeCase(id, body, userId);
  }
}
