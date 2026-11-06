import { Controller, Get, Post, Patch, Param, Delete, Body, Query, Request, UseGuards, UseInterceptors, UploadedFiles, Res } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from "@nestjs/swagger";
import { EthicsService } from "./ethics.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../common/enums/user-role.enum";
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateComplaintDto } from "./dto/create-complaint.dto";

@ApiTags('Ethics & Anti-Corruption')
@ApiBearerAuth()
@Controller('ethics/anticorruption')
export class EthicsController {
  constructor(private readonly ethicsService: EthicsService) {}

  // Anti-Corruption Report Endpoints
  @Post('reports/public')
  @ApiOperation({ summary: 'Submit a public anti-corruption report (no authentication required)' })
  @ApiResponse({ status: 201, description: 'Report submitted successfully' })
  async createPublicReport(@Body() createComplaintDto: CreateComplaintDto) {
    return this.ethicsService.createComplaint(createComplaintDto, null);
  }

  @Post('reports/track')
  @ApiOperation({ summary: 'Track a report by tracking ID (no authentication required)' })
  @ApiResponse({ status: 200, description: 'Report details' })
  async trackReport(@Body() body: { trackingId: string }) {
    return this.ethicsService.trackComplaint(body.trackingId);
  }

  @Post('reports/track/messages')
  @ApiOperation({ summary: 'Get report messages by tracking ID (no authentication required)' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  async getMessagesByTrackingId(@Body() body: { trackingId: string }) {
    return this.ethicsService.getMessagesByTrackingId(body.trackingId);
  }

  @Post('reports/track/messages/send')
  @ApiOperation({ summary: 'Send message by tracking ID (no authentication required - for complainants)' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendMessageByTrackingId(@Body() body: { trackingId: string; message: string }) {
    try {
      console.log('[Controller] sendMessageByTrackingId called with trackingId:', body.trackingId);
      const result = await this.ethicsService.sendMessageByTrackingId(body.trackingId, body.message);
      console.log('[Controller] sendMessageByTrackingId success');
      return result;
    } catch (error) {
      console.error('[Controller] sendMessageByTrackingId error:', error);
      console.error('[Controller] Error details:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  @Post('reports')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new anti-corruption report' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  async createReport(@Body() createComplaintDto: CreateComplaintDto, @Request() req) {
    const userId = req.user?.id || req.user?.sub;
    return this.ethicsService.createComplaint(createComplaintDto, userId);
  }

  @Get('reports')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all anti-corruption reports with filters' })
  @ApiResponse({ status: 200, description: 'List of reports' })
  async findAllReports(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.userId || req?.user?.id || req?.user?.sub;
    const userRoles = req?.user?.roles || [];
    const isEthicsOfficer = userRoles.includes('Ethics_Officer') || userRoles.includes('ethics_officer');
    const isEthicsAntiCorruption = userRoles.includes('Ethics_Anti_Corruption') || userRoles.includes('ethics_anti_corruption');
    const isInvestigator = isEthicsOfficer || isEthicsAntiCorruption;
    console.log('[findAllReports] userId:', userId, 'userRoles:', userRoles, 'isEthicsOfficer:', isEthicsOfficer, 'isEthicsAntiCorruption:', isEthicsAntiCorruption, 'isInvestigator:', isInvestigator);
    return this.ethicsService.findAllComplaints({ status, category, priority, search, userId, isInvestigator });
  }

  @Get('reports/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get report by ID' })
  @ApiResponse({ status: 200, description: 'Report details' })
  async findReportById(@Param('id') id: string) {
    return this.ethicsService.findComplaintById(id);
  }

  @Patch('reports/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update report' })
  @ApiResponse({ status: 200, description: 'Report updated' })
  async updateReport(@Param('id') id: string, @Body() updateData: any) {
    return this.ethicsService.updateComplaint(id, updateData);
  }

  @Post('reports/:id/assign')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Assign report to an officer' })
  @ApiResponse({ status: 200, description: 'Report assigned' })
  async assignReport(@Param('id') id: string, @Body('assigneeId') assigneeId: string) {
    return this.ethicsService.assignComplaint(id, assigneeId);
  }

  @Post('reports/:id/screen')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Ethics_Officer, UserRole.Ethics_Anti_Corruption)
  @ApiOperation({ summary: 'Screen a report (Ethics Officer / Complaint Registration Officer)' })
  @ApiResponse({ status: 200, description: 'Report screened successfully' })
  async screenReport(
    @Param('id') id: string,
    @Body() screeningData: any,
    @Request() req
  ) {
    const screenerId = req.user?.id || req.user?.sub;
    return this.ethicsService.screenComplaint(id, screeningData, screenerId);
  }

  @Post('reports/:id/assess')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Ethics_Officer, UserRole.Ethics_Anti_Corruption)
  @ApiOperation({ summary: 'Assess report (Assessment / Triage Officer)' })
  @ApiResponse({ status: 200, description: 'Report assessed successfully' })
  async assessReport(
    @Param('id') id: string,
    @Body() assessmentData: any,
    @Request() req
  ) {
    const assessorId = req.user?.id || req.user?.sub;
    return this.ethicsService.assessComplaint(id, assessmentData, assessorId);
  }

  @Post('reports/:id/approve-route')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Ethics_Anti_Corruption)
  @ApiOperation({ summary: 'Approve investigation route (Investigation Supervisor)' })
  @ApiResponse({ status: 200, description: 'Route approved successfully' })
  async approveInvestigationRoute(
    @Param('id') id: string,
    @Body() approvalData: any,
    @Request() req
  ) {
    const approverId = req.user?.id || req.user?.sub;
    return this.ethicsService.approveInvestigationRoute(id, approvalData, approverId);
  }

  @Post('reports/:id/assign-investigator')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Ethics_Anti_Corruption)
  @ApiOperation({ summary: 'Assign investigator (Investigation Supervisor)' })
  @ApiResponse({ status: 200, description: 'Investigator assigned successfully' })
  async assignInvestigator(
    @Param('id') id: string,
    @Body() body: { assigneeId: string; scope?: string; objectives?: string; investigationPlan?: string; targetCompletionDate?: string },
    @Request() req
  ) {
    const assignedById = req.user?.id || req.user?.sub;
    return this.ethicsService.assignInvestigator(id, body.assigneeId, assignedById, body);
  }

  @Post('reports/assign-investigator')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Assign an investigator to an anti-corruption report' })
  @ApiResponse({ status: 200, description: 'Investigator assigned successfully' })
  async assignInvestigatorByBody(@Body() body: { reportId: string; investigatorId: string }, @Request() req) {
    const assignedById = req.user?.id || req.user?.sub;
    return this.ethicsService.assignInvestigator(body.reportId, body.investigatorId, assignedById, {});
  }

  @Post('reports/:id/messages')
  @ApiOperation({ summary: 'Send message to complainant' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendMessage(
    @Param('id') id: string,
    @Body() body: { message: string; messageType?: string; visibility?: string },
    @Request() req
  ) {
    const senderId = req.user?.userId || req.user?.id || req.user?.sub;
    const senderRole = req.user?.roles?.[0] || 'Unknown';
    const normalizedRoles = req.user?.roles?.map(r => r.toUpperCase()) || [];
    const senderType = normalizedRoles.includes('END_USER') ? 'COMPLAINANT' : 'DEPARTMENT';
    return this.ethicsService.sendMessageToComplainant(
      id,
      body.message,
      senderId,
      senderRole,
      senderType,
      body.messageType || 'REPLY',
      body.visibility || 'COMPLAINANT_VISIBLE'
    );
  }

  @Get('reports/:id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get report messages' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  async getMessages(@Param('id') id: string, @Request() req) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    const userRoles = req.user?.roles || [];
    console.log(`[getMessages Controller] Report ID: ${id}, User ID: ${userId}, User Roles: ${JSON.stringify(userRoles)}, Full User: ${JSON.stringify(req.user)}`);
    return this.ethicsService.getComplaintMessages(id, userId, userRoles);
  }

  @Patch('reports/:id/messages/:messageId/read')
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiResponse({ status: 200, description: 'Message marked as read' })
  async markMessageAsRead(@Param('id') id: string, @Param('messageId') messageId: string, @Request() req) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.ethicsService.markMessageAsRead(messageId, userId);
  }

  @Get('department/reports/inbox')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Ethics_Officer, UserRole.Ethics_Anti_Corruption)
  @ApiOperation({ summary: 'Get department reports inbox' })
  @ApiResponse({ status: 200, description: 'Department inbox retrieved' })
  async getDepartmentInbox(@Query('status') status?: string) {
    return this.ethicsService.getDepartmentInbox(status);
  }

  @Get('department/reports/inbox/unread-count')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Ethics_Officer, UserRole.Ethics_Anti_Corruption)
  @ApiOperation({ summary: 'Get unread message count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved' })
  async getUnreadCount() {
    return this.ethicsService.getUnreadMessageCount();
  }

  // Investigation Endpoints
  @Post('investigations/:id/submit-report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Ethics_Officer, UserRole.Ethics_Anti_Corruption)
  @ApiOperation({ summary: 'Submit investigation report (Investigator)' })
  @ApiResponse({ status: 200, description: 'Report submitted successfully' })
  async submitInvestigationReport(
    @Param('id') id: string,
    @Body() reportData: any,
    @Request() req
  ) {
    const investigatorId = req.user?.id || req.user?.sub;
    return this.ethicsService.submitInvestigationReport(id, reportData, investigatorId);
  }

  @Post('investigations/:id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Ethics_Anti_Corruption)
  @ApiOperation({ summary: 'Review investigation report (Reviewer / Supervisor)' })
  @ApiResponse({ status: 200, description: 'Report reviewed successfully' })
  async reviewInvestigationReport(
    @Param('id') id: string,
    @Body() reviewData: any,
    @Request() req
  ) {
    const reviewerId = req.user?.id || req.user?.sub;
    return this.ethicsService.reviewInvestigationReport(id, reviewData, reviewerId);
  }

  @Post('investigations/:id/approve-decision')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Ethics_Anti_Corruption)
  @ApiOperation({ summary: 'Approve decision or referral (Authorized Decision-Maker)' })
  @ApiResponse({ status: 200, description: 'Decision approved successfully' })
  async approveDecision(
    @Param('id') id: string,
    @Body() decisionData: any,
    @Request() req
  ) {
    const decisionMakerId = req.user?.id || req.user?.sub;
    return this.ethicsService.approveDecision(id, decisionData, decisionMakerId);
  }

  @Post('investigations/:id/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Ethics_Anti_Corruption)
  @ApiOperation({ summary: 'Close case (Case Management Officer)' })
  @ApiResponse({ status: 200, description: 'Case closed successfully' })
  async closeCase(
    @Param('id') id: string,
    @Body() closureData: any,
    @Request() req
  ) {
    const closerId = req.user?.id || req.user?.sub;
    return this.ethicsService.closeCase(id, closureData, closerId);
  }

  // Investigation Endpoints
  @Post('investigations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Ethics_Officer, UserRole.Ethics_Anti_Corruption)
  @ApiOperation({ summary: 'Create a new investigation' })
  @ApiResponse({ status: 201, description: 'Investigation created successfully' })
  async createInvestigation(@Body() data: any, @Request() req) {
    const userId = req.user?.id || req.user?.sub;
    return this.ethicsService.createInvestigation(data, userId);
  }

  @Get('investigations')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all investigations with filters' })
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

  @Get('investigations/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get investigation by ID' })
  @ApiResponse({ status: 200, description: 'Investigation details' })
  async findInvestigationById(@Param('id') id: string) {
    return this.ethicsService.findInvestigationById(id);
  }

  @Patch('investigations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Ethics_Officer, UserRole.Ethics_Anti_Corruption)
  @ApiOperation({ summary: 'Update investigation details' })
  @ApiResponse({ status: 200, description: 'Investigation updated' })
  async updateInvestigation(
    @Param('id') id: string,
    @Body() updateData: any,
    @Request() req
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.ethicsService.updateInvestigation(id, updateData, userId);
  }

  @Post('investigations/:id/plan')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Ethics_Officer, UserRole.Ethics_Anti_Corruption)
  @ApiOperation({ summary: 'Update investigation plan (Investigator)' })
  @ApiResponse({ status: 200, description: 'Investigation plan updated' })
  async updateInvestigationPlan(
    @Param('id') id: string,
    @Body() planData: any,
    @Request() req
  ) {
    const investigatorId = req.user?.id || req.user?.sub;
    return this.ethicsService.updateInvestigationPlan(id, planData, investigatorId);
  }

  @Post('investigations/:id/evidence')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Ethics_Officer, UserRole.Ethics_Anti_Corruption)
  @ApiOperation({ summary: 'Add evidence to investigation' })
  @ApiResponse({ status: 201, description: 'Evidence added successfully' })
  async addEvidence(
    @Param('id') id: string,
    @Body() evidenceData: any,
    @Request() req
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.ethicsService.addEvidenceToInvestigation(id, evidenceData, userId);
  }

  @Post('investigations/:id/activities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Ethics_Officer, UserRole.Ethics_Anti_Corruption)
  @ApiOperation({ summary: 'Add activity to investigation' })
  @ApiResponse({ status: 201, description: 'Activity added successfully' })
  async addActivity(
    @Param('id') id: string,
    @Body() activityData: any,
    @Request() req
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.ethicsService.addActivityToInvestigation(id, activityData, userId);
  }

  // Statistics Endpoint
  @Get('statistics')
  @ApiOperation({ summary: 'Get ethics and anti-corruption statistics' })
  @ApiResponse({ status: 200, description: 'Statistics data' })
  async getStatistics() {
    return this.ethicsService.getStatistics();
  }

  // Policy Endpoints
  @Post('policies')
  @UseInterceptors(FilesInterceptor('attachments', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new policy' })
  @ApiResponse({ status: 201, description: 'Policy created successfully' })
  async createPolicy(
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.ethicsService.createPolicy(body, files, userId);
  }

  @Get('policies')
  @ApiOperation({ summary: 'Get all policies with filters' })
  @ApiResponse({ status: 200, description: 'List of policies' })
  async findAllPolicies(
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.ethicsService.findAllPolicies({ category, status, search });
  }

  @Get('policies/:id/download')
  @ApiOperation({ summary: 'Download policy file' })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  async downloadPolicy(@Param('id') id: string, @Res() res: any) {
    return this.ethicsService.downloadPolicy(id, res);
  }

  // Declaration Endpoints
  @Post('declarations')
  @UseInterceptors(FilesInterceptor('attachments', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new declaration' })
  @ApiResponse({ status: 201, description: 'Declaration created successfully' })
  async createDeclaration(
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.ethicsService.createDeclaration(body, files, userId);
  }

  @Get('declarations')
  @ApiOperation({ summary: 'Get all declarations with filters' })
  @ApiResponse({ status: 200, description: 'List of declarations' })
  async findAllDeclarations(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.ethicsService.findAllDeclarations({ type, status, search });
  }
}
