import { Controller, Get, Post, Patch, Param, Body, Query, Request, UseGuards, UseInterceptors, UploadedFiles } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from "@nestjs/swagger";
import { FeedbackService } from "./feedback.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateComplaintDto } from "../ethics/dto/create-complaint.dto";
import { FilesInterceptor } from "@nestjs/platform-express";

@ApiTags('Feedback and Complaints')
@ApiBearerAuth()
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('complaints/public')
  @ApiOperation({ summary: 'Submit a public feedback complaint (no authentication required)' })
  @ApiResponse({ status: 201, description: 'Feedback submitted successfully' })
  async createPublicFeedback(@Body() createComplaintDto: CreateComplaintDto) {
    return this.feedbackService.createFeedback(createComplaintDto, null);
  }

  @Post('complaints/track')
  @ApiOperation({ summary: 'Track a feedback complaint by tracking ID (no authentication required)' })
  @ApiResponse({ status: 200, description: 'Feedback details' })
  async trackFeedback(@Body() body: { trackingId: string }) {
    return this.feedbackService.trackFeedback(body.trackingId);
  }

  @Get('complaints/tracking/:trackingId')
  @ApiOperation({ summary: 'Track a feedback complaint by tracking ID via GET (no authentication required)' })
  @ApiResponse({ status: 200, description: 'Feedback details' })
  async trackFeedbackGet(@Param('trackingId') trackingId: string) {
    return this.feedbackService.trackFeedback(trackingId);
  }

  @Post('complaints/track/messages')
  @ApiOperation({ summary: 'Get feedback complaint messages by tracking ID (no authentication required)' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  async getMessagesByTrackingId(@Body() body: { trackingId: string }) {
    return this.feedbackService.getMessagesByTrackingId(body.trackingId);
  }

  @Post('complaints/track/messages/send')
  @ApiOperation({ summary: 'Send message by tracking ID (no authentication required - for complainants)' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendMessageByTrackingId(@Body() body: { trackingId: string; message: string }) {
    return this.feedbackService.sendMessageByTrackingId(body.trackingId, body.message);
  }

  @Post('complaints/track/petition')
  @ApiOperation({ summary: 'Submit petition by tracking ID (no authentication required - for complainants)' })
  @ApiResponse({ status: 200, description: 'Petition submitted' })
  async submitPetitionByTrackingId(
    @Body() body: {
      trackingId: string;
      reasonForDissatisfaction: string;
      explanation: string;
      additionalInfo?: string;
      requestedAction?: string;
    }
  ) {
    return this.feedbackService.submitPetitionByTrackingId(body.trackingId, body);
  }

  @Post('complaints/track/accept-response')
  @ApiOperation({ summary: 'Accept response by tracking ID (no authentication required - for complainants)' })
  @ApiResponse({ status: 200, description: 'Response accepted' })
  async acceptResponseByTrackingId(@Body() body: { trackingId: string }) {
    return this.feedbackService.acceptResponseByTrackingId(body.trackingId);
  }

  @Post('complaints')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new feedback complaint' })
  @ApiResponse({ status: 201, description: 'Feedback created successfully' })
  async createFeedback(@Body() createComplaintDto: CreateComplaintDto, @Request() req) {
    const userId = req.user?.id || req.user?.sub;
    return this.feedbackService.createFeedback(createComplaintDto, userId);
  }

  @Get('complaints')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all feedback complaints with filters' })
  @ApiResponse({ status: 200, description: 'List of feedback complaints' })
  async findAllFeedback(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.userId || req?.user?.id || req?.user?.sub;
    const userRoles = req?.user?.roles || [];
    const isFeedbackManager = userRoles.includes('Feedback_Complaint_Manager') || userRoles.includes('feedback_complaint_manager');
    const isFeedbackOfficer = userRoles.includes('Feedback_Complaint_Officer') || userRoles.includes('feedback_complaint_officer');
    const isAdministrativeComplaintsTeam = userRoles.includes('Administrative_Complaints_Team');
    const isCommissioner = userRoles.includes('Commissioner') || userRoles.includes('commissioner');
    const isFeedbackStaff = isFeedbackManager || isFeedbackOfficer || isAdministrativeComplaintsTeam || isCommissioner;
    const isDepartmentHead = userRoles.includes('Department_Head') || userRoles.includes('department_head');
    return this.feedbackService.findAllFeedback({ status, category, priority, search, userId, isFeedbackStaff, isDepartmentHead });
  }

  @Get('complaints/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get feedback complaint by ID' })
  @ApiResponse({ status: 200, description: 'Feedback details' })
  async findFeedbackById(@Param('id') id: string) {
    return this.feedbackService.findFeedbackById(id);
  }

  @Patch('complaints/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update feedback complaint' })
  @ApiResponse({ status: 200, description: 'Feedback updated' })
  async updateFeedback(@Param('id') id: string, @Body() updateData: any) {
    return this.feedbackService.updateFeedback(id, updateData);
  }

  @Post('complaints/:id/messages')
  @ApiOperation({ summary: 'Send message to feedback complainant' })
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
    return this.feedbackService.sendMessageToComplainant(
      id,
      body.message,
      senderId,
      senderRole,
      senderType,
      body.messageType || 'REPLY',
      body.visibility || 'COMPLAINANT_VISIBLE'
    );
  }

  @Get('complaints/:id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get feedback complaint messages' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  async getMessages(@Param('id') id: string, @Request() req) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    const userRoles = req.user?.roles || [];
    return this.feedbackService.getFeedbackMessages(id, userId, userRoles);
  }

  @Get('investigations')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all feedback investigations' })
  @ApiResponse({ status: 200, description: 'List of investigations' })
  async findAllInvestigations(@Query('bypassUserFilter') bypassUserFilter?: string, @Request() req?: any) {
    const userId = req?.user?.userId || req?.user?.id || req?.user?.sub;
    const userRoles = req?.user?.roles || [];
    const isFeedbackStaff = userRoles.includes('Feedback_Complaint_Manager') || 
                          userRoles.includes('feedback_complaint_manager') ||
                          userRoles.includes('Feedback_Complaint_Officer') || 
                          userRoles.includes('feedback_complaint_officer');
    return this.feedbackService.findAllInvestigations(userId, isFeedbackStaff, bypassUserFilter === 'true');
  }

  @Get('investigations/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get investigation by ID' })
  @ApiResponse({ status: 200, description: 'Investigation details' })
  async findInvestigationById(@Param('id') id: string) {
    return this.feedbackService.findInvestigationById(id);
  }

  @Post('complaints/:id/investigation')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create investigation for a complaint' })
  @ApiResponse({ status: 201, description: 'Investigation created successfully' })
  async createInvestigation(
    @Param('id') id: string,
    @Body() body: { assignedInvestigatorId?: string; assignedSupervisorId?: string; startDate?: string; targetCompletionDate?: string; scope?: string; objectives?: string },
    @Request() req
  ) {
    const assignedById = req.user?.userId || req.user?.id || req.user?.sub;
    return this.feedbackService.createInvestigation(id, body, assignedById);
  }

  @Post('complaints/:id/return')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Return complaint to complainant' })
  @ApiResponse({ status: 200, description: 'Complaint returned successfully' })
  async returnToComplainant(
    @Param('id') id: string,
    @Body() body: { returnReason: string },
    @Request() req
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.feedbackService.returnToComplainant(id, body.returnReason, userId);
  }

  @Get('officers')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get feedback officers for assignment' })
  @ApiResponse({ status: 200, description: 'List of feedback officers' })
  async getFeedbackOfficers(@Request() req) {
    return this.feedbackService.getFeedbackOfficers();
  }

  @Patch('investigations/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update investigation' })
  @ApiResponse({ status: 200, description: 'Investigation updated successfully' })
  async updateInvestigation(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req
  ) {
    return this.feedbackService.updateInvestigation(id, body);
  }

  @Post('investigations/:id/evidence')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ summary: 'Upload evidence files for investigation' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Evidence uploaded successfully' })
  async uploadEvidence(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.feedbackService.uploadEvidence(id, files, userId);
  }

  @Get('departments')
  @ApiOperation({ summary: 'Get all departments (public)' })
  @ApiResponse({ status: 200, description: 'List of departments' })
  async getDepartments() {
    return this.feedbackService.getDepartments();
  }

  @Post('complaints/:id/assign-department')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Assign complaint to department' })
  @ApiResponse({ status: 200, description: 'Complaint assigned to department' })
  async assignToDepartment(
    @Param('id') id: string,
    @Body() body: { departmentId: string; instructions?: string },
    @Request() req
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.feedbackService.assignToDepartment(id, body.departmentId, body.instructions, userId);
  }

  @Post('complaints/:id/departmental-response')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit departmental response' })
  @ApiResponse({ status: 200, description: 'Departmental response submitted' })
  async submitDepartmentalResponse(
    @Param('id') id: string,
    @Body() body: {
      summary: string;
      investigationConducted: string;
      findings: string;
      actionsTaken: string;
      proposedActions?: string;
      officialResponse: string;
      recommendations?: string;
    },
    @Request() req
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.feedbackService.submitDepartmentalResponse(id, body, userId);
  }

  @Post('complaints/:id/petition')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit petition' })
  @ApiResponse({ status: 200, description: 'Petition submitted' })
  async submitPetition(
    @Param('id') id: string,
    @Body() body: {
      reasonForDissatisfaction: string;
      explanation: string;
      additionalInfo?: string;
      requestedAction?: string;
    },
    @Request() req
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.feedbackService.submitPetition(id, body, userId);
  }

  @Post('petitions/assign')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Assign petition to officer' })
  @ApiResponse({ status: 200, description: 'Petition assigned' })
  async assignPetition(
    @Body() body: { complaintId: string; officerId: string; investigationInstructions?: string; investigationDeadline?: string },
    @Request() req
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.feedbackService.assignPetition(body.complaintId, body.officerId, userId, body.investigationInstructions, body.investigationDeadline);
  }

  @Get('petitions/count')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get petition count for user' })
  @ApiResponse({ status: 200, description: 'Petition count' })
  async getPetitionCount(@Request() req) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    const userRole = req.user?.roles?.[0] || '';
    return this.feedbackService.getPetitionCount(userId, userRole);
  }

  @Get('petitions/assigned')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get petitions assigned to officer' })
  @ApiResponse({ status: 200, description: 'Assigned petitions' })
  async getAssignedPetitions(@Request() req) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.feedbackService.getAssignedPetitions(userId);
  }

  @Get('petitions/all')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all petitions for managers' })
  @ApiResponse({ status: 200, description: 'All petitions' })
  async getAllPetitions() {
    return this.feedbackService.getAllPetitions();
  }

  @Post('petitions/create')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new petition' })
  @ApiResponse({ status: 201, description: 'Petition created' })
  async createPetition(
    @Body() body: {
      petitionNumber: string;
      complaintId: string;
      reasonForDissatisfaction: string;
      explanation: string;
      status?: string;
    },
    @Request() req
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.feedbackService.createPetition(body, userId);
  }

  @Post('petitions/:id/commissioner-decision')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit commissioner final decision on petition' })
  @ApiResponse({ status: 200, description: 'Commissioner decision submitted successfully' })
  async submitCommissionerDecision(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.feedbackService.submitCommissionerDecision(id, body, userId);
  }

  @Post('petitions/:id/send-notification')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send notification to concerned department and complainant' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  async sendNotification(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.feedbackService.sendCommissionerDecisionNotification(id, body, userId);
  }

  @Post('petitions/:id/investigation-report')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit investigation report' })
  @ApiResponse({ status: 200, description: 'Investigation report submitted' })
  async submitInvestigationReport(
    @Param('id') id: string,
    @Body() body: {
      background: string;
      objectives: string;
      activitiesPerformed: string;
      evidenceCollected: string;
      personsInterviewed: string;
      findings: string;
      observations: string;
      conclusions: string;
      recommendations: string;
    },
    @Request() req
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.feedbackService.submitInvestigationReport(id, body, userId);
  }

  @Post('petitions/:id/send-to-commissioner')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send petition to commissioner for review' })
  @ApiResponse({ status: 200, description: 'Petition sent to commissioner' })
  async sendPetitionToCommissioner(
    @Param('id') id: string,
    @Body() body: {
      commissionerId: string;
      managerConclusion: string;
    },
    @Request() req
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.feedbackService.sendPetitionToCommissioner(id, body, userId);
  }

  @Get('petitions/:id/commissioner-decision')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get commissioner decision details' })
  @ApiResponse({ status: 200, description: 'Commissioner decision retrieved' })
  async getCommissionerDecision(
    @Param('id') id: string,
    @Request() req
  ) {
    return this.feedbackService.getCommissionerDecision(id);
  }

  @Post('complaints/:id/accept-response')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Accept or reject departmental response' })
  @ApiResponse({ status: 200, description: 'Response accepted/rejected' })
  async acceptResponse(
    @Param('id') id: string,
    @Body() body: { decision: 'accept' | 'reject'; reason?: string },
    @Request() req
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.feedbackService.acceptResponse(id, body.decision, body.reason, userId);
  }

  @Post('complaints/:id/final-decision')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Issue final decision' })
  @ApiResponse({ status: 200, description: 'Final decision issued' })
  async issueFinalDecision(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req,
  ) {
    const userId = req.user?.sub || req.user?.id;
    return this.feedbackService.issueFinalDecision(id, body, userId);
  }

  @Post('complaints/:id/mark-viewed')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mark complaint as viewed' })
  @ApiResponse({ status: 200, description: 'Complaint marked as viewed' })
  async markAsViewed(@Param('id') id: string, @Request() req) {
    const userId = req.user?.sub || req.user?.id;
    return this.feedbackService.markAsViewed(id, userId);
  }

  // Administrative Complaints Workflow Endpoints

  @Post('complaints/:id/assign-administrative-team')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Assign complaint to administrative complaints team' })
  @ApiResponse({ status: 200, description: 'Complaint assigned to administrative team' })
  async assignToAdministrativeComplaintsTeam(@Param('id') id: string, @Request() req, @Body() body: { assignedUserId?: string; instructions?: string }) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.feedbackService.assignToAdministrativeComplaintsTeam(id, userId, body.assignedUserId, body.instructions);
  }

  @Post('complaints/:id/forward-investigation-team')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Forward complaint to investigation team' })
  @ApiResponse({ status: 200, description: 'Complaint forwarded to investigation team' })
  async forwardToInvestigationTeam(@Param('id') id: string, @Request() req) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.feedbackService.forwardToInvestigationTeam(id, userId);
  }

  @Post('complaints/:id/administrative-investigation-report')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit administrative investigation report' })
  @ApiResponse({ status: 200, description: 'Investigation report submitted' })
  async submitAdministrativeInvestigationReport(
    @Param('id') id: string,
    @Body() reportData: any,
    @Request() req
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.feedbackService.submitAdministrativeInvestigationReport(id, reportData, userId);
  }

  @Post('complaints/:id/commissioner-review-administrative')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Commissioner review administrative complaint' })
  @ApiResponse({ status: 200, description: 'Review completed' })
  async commissionerReviewAdministrativeComplaint(
    @Param('id') id: string,
    @Body() body: { decision: 'approve' | 'reject' | 'return'; comments: string },
    @Request() req
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.feedbackService.commissionerReviewAdministrativeComplaint(id, body.decision, body.comments, userId);
  }

  @Post('complaints/:id/send-administrative-response')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send administrative complaint response to complainant' })
  @ApiResponse({ status: 200, description: 'Response sent' })
  async sendAdministrativeComplaintResponse(
    @Param('id') id: string,
    @Body() responseData: any,
    @Request() req
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.feedbackService.sendAdministrativeComplaintResponse(id, responseData, userId);
  }

  @Post('complaints/:id/close-administrative')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Close administrative complaint' })
  @ApiResponse({ status: 200, description: 'Complaint closed' })
  async closeAdministrativeComplaint(@Param('id') id: string, @Request() req) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.feedbackService.closeAdministrativeComplaint(id, userId);
  }
}
