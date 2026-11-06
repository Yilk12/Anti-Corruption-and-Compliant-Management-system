import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { WorkflowService } from './workflow.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { RolesGuard } from '../auth/guards/roles.guard'
import { UserRole } from '../common/enums/user-role.enum'

// Minimal placeholder controller to scaffold Field and Overtime endpoints.
// Replace method bodies with real implementations using Prisma and WorkflowService as needed.

@Controller('workflow')
export class FieldOvertimeController {
  constructor(private readonly workflow: WorkflowService) {}
  // Field Requests
  @UseGuards(JwtAuthGuard)
  @Get('field-requests')
  async getFieldRequests(@Request() req: any, @Query('reqId') _reqId?: string, @Query('departmentId') _departmentId?: string) {

    const user = req.user as { userId: string; role: string; departmentId?: string | null }

    let filters: { reqId?: string; departmentId?: string }
    if (user.role === 'Department_Head' && user.departmentId) {
      filters = { departmentId: user.departmentId }
    } else {
      filters = { reqId: user.userId }
    }

 

    const data = await this.workflow.listFieldRequests(filters)
    // Filter out notifications created for the current logged-in user
    const filtered = Array.isArray(data)
      ? data.map((r: any) => ({
          ...r,
          fieldNotifications: Array.isArray(r.fieldNotifications)
            ? r.fieldNotifications.filter((n: any) => n.userId !== user.userId)
            : [],
        }))
      : []
    return { ok: true, data: filtered }
  }


  // Approved field requests (restricted to Department Head for now; Asset Officer role removed)
  @UseGuards(JwtAuthGuard)
  @Get('field-requests/hr-supervisor')
  async getApprovedFieldRequests(@Request() req: any) {
    const primaryRole = (req.user?.role || '').toLowerCase()
    const roles: string[] = Array.isArray(req.user?.roles)
      ? req.user.roles.map((r: string) => String(r).toLowerCase())
      : (primaryRole ? [primaryRole] : [])

    const isDeptHead =
      roles.includes('department_head') ||
      roles.includes('department-head') ||
      roles.includes('dept_head') ||
      roles.includes('departmenthead')

    if (!isDeptHead) {
      throw new ForbiddenException('Only Department Head can access approved field requests')
    }

    const data = await this.workflow.getApprovedFieldRequests()
    return { ok: true, data }
  }

  // Field Notifications APIs
  @UseGuards(JwtAuthGuard)
  @Get('field-requests/:id/notifications')
  async getFieldRequestNotifications(@Param('id') id: string, @Request() req: any) {
    const user = req.user as { userId: string }
    const data = await this.workflow.getFieldRequestNotifications(id)
    const filtered = Array.isArray(data) ? data.filter(n => n.userId !== user.userId) : []
    return { ok: true, data: filtered }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('field-notifications')
  @Roles(UserRole.Department_Head)
  async listMyFieldNotifications(@Request() req: any) {
    const user = req.user as { userId: string };
    const data = await this.workflow.listUserFieldNotifications(user.userId);
    return { ok: true, data };
  }

  // Overtime notifications for Department Head
  @UseGuards(JwtAuthGuard)
  @Get('overtime-notifications/department-head')
  async getDeptHeadOvertimeNotifications(@Request() req: any) {
    const primaryRole = (req.user?.role || '').toLowerCase()
    const roles: string[] = Array.isArray(req.user?.roles)
      ? req.user.roles.map((r: string) => String(r).toLowerCase())
      : (primaryRole ? [primaryRole] : [])

    const isDeptHead =
      roles.includes('department_head') ||
      roles.includes('department-head') ||
      roles.includes('dept_head') ||
      roles.includes('departmenthead')

    if (!isDeptHead) {
      throw new ForbiddenException('Only Department Head can access overtime notifications')
    }

    const userId = req.user?.userId as string | undefined
    if (!userId) {
      throw new BadRequestException('Missing authenticated user')
    }

    const data = await this.workflow.listDeptHeadOvertimeNotifications(userId)
    return { ok: true, data }
  }

  // Delete a single field notification by ID
  @UseGuards(JwtAuthGuard)
  @Delete('field-notifications/:id')
  async deleteFieldNotification(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.userId as string | undefined
    const result = await this.workflow.deleteFieldNotificationById(id, userId)
    if (!result) {
      throw new Error('Field notification not found')
    }
    return { ok: true, data: result }
  }

  // Delete any notification (UserNotification, AllNotification, HrNotification) by ID
  @UseGuards(JwtAuthGuard)
  @Delete('notifications/:id')
  async deleteAnyNotification(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.userId as string | undefined
    const result = await this.workflow.deleteAnyNotificationById(id, userId)
    if (!result) {
      throw new NotFoundException('Notification not found')
    }
    return { ok: true, data: result }
  }

  // Per-user Overtime Notifications (only for the logged-in user)
  @UseGuards(JwtAuthGuard)
  @Get('overtime/user-notifications')
  async getMyOvertimeNotifications(@Request() req: any) {
    const userId = req.user?.userId as string | undefined
    if (!userId) {
      throw new BadRequestException('Missing authenticated user')
    }
    const data = await this.workflow.getUserOvertimeNotifications(userId)
    return { ok: true, data }
  }

  @UseGuards(JwtAuthGuard)
  @Post('field-requests')
  async createFieldRequest(@Body() body: any, @Request() req: any) {
    // Expecting: fieldType, fromDate, toDate, and optionally: description, location, startTime, endTime, durationType
    // Derive reqId and departmentId from authenticated user when not provided explicitly
    const user = req.user
    const payload = {
      ...body,
      reqId: body?.reqId ?? user?.userId,
      departmentId: body?.departmentId ?? user?.departmentId ?? undefined,
    }

    if (!payload.reqId) {
      throw new BadRequestException('reqId is required and will be derived from the authenticated user. Ensure you are logged in or provide reqId explicitly.')
    }

    const created = await this.workflow.createFieldRequest(payload)
    return { ok: true, data: created }
  }

  // Admin/maintenance: Backfill existing FieldNotification messages to Amharic
  @UseGuards(JwtAuthGuard)
  @Post('notifications/backfill-field')
  async backfillFieldNotifications() {
    const res = await this.workflow.backfillFieldNotificationMessages()
    return { ok: true, data: res }
  }

  @Get('field-requests/:id')
  getFieldRequest(@Param('id') id: string) {
    return { ok: true, data: { id }, message: 'Field request detail placeholder' }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('field-requests/:id')
  async updateFieldRequest(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    // Allow updating status: APPROVED/REJECTED or ACCEPTED/NOT_ACCEPTED
    const { status } = body as { status?: 'APPROVED' | 'REJECTED' | 'ACCEPTED' | 'NOT_ACCEPTED' }
    if (!status) {
      throw new BadRequestException("Missing status. Use 'APPROVED' | 'REJECTED' | 'ACCEPTED' | 'NOT_ACCEPTED'.")
    }

    // Determine roles
    const rawRoles: string[] = Array.isArray(req.user?.roles)
      ? (req.user.roles as string[])
      : ((req.user?.role ? [req.user.role] : []) as string[])
    const normalized = rawRoles.map((r) => String(r).toLowerCase().replace(/[_-]/g, ' ').trim())
    const isDeptHead =
      normalized.includes('department head') ||
      normalized.includes('departmenthead') ||
      normalized.includes('dept head')

    // Previously enforced Asset Officer for ACCEPTED/NOT_ACCEPTED; that role is removed.
    // For now, allow any authenticated user to call ACCEPTED/NOT_ACCEPTED, while keeping
    // Department Head restriction for APPROVED/REJECTED.
    // Enforce that Department Head can only APPROVE/REJECT
    if ((status === 'APPROVED' || status === 'REJECTED') && !isDeptHead) {
      throw new ForbiddenException('Only Department Head can approve/reject field requests')
    }

    let updated: any
    if (status === 'APPROVED' || status === 'REJECTED') {
      updated = await this.workflow.updateFieldRequestStatus(id, status, req.user?.userId)
    } else if (status === 'ACCEPTED' || status === 'NOT_ACCEPTED') {
      updated = await this.workflow.updateFieldRequestAcceptance(id, status, req.user?.userId)
    } else {
      throw new BadRequestException('Unsupported status value')
    }
    return { ok: true, data: updated }
  }

  @Delete('field-requests/:id')
  removeFieldRequest(@Param('id') id: string) {
    return { ok: true, id, message: 'Field request delete placeholder' }
  }

  @UseGuards(JwtAuthGuard)
  @Post('field-requests/:id/approve')
  async approveFieldRequest(@Param('id') id: string, @Request() req: any) {
    const updated = await this.workflow.updateFieldRequestStatus(id, 'APPROVED', req.user?.userId)
    return { ok: true, data: updated }
  }

  @UseGuards(JwtAuthGuard)
  @Post('field-requests/:id/reject')
  async rejectFieldRequest(@Param('id') id: string, @Request() req: any) {
    const updated = await this.workflow.updateFieldRequestStatus(id, 'REJECTED', req.user?.userId)
    return { ok: true, data: updated }
  }

  // HR acceptance endpoints (ACCEPTED / NOT_ACCEPTED)
  @UseGuards(JwtAuthGuard)
  @Post('overtime/:id/accept')
  async acceptOvertimeRequestByHR(@Param('id') id: string, @Request() req: any) {
    const rawRoles: string[] = Array.isArray(req.user?.roles)
      ? (req.user.roles as string[])
      : ((req.user?.role ? [req.user.role] : []) as string[])
    const normalized = rawRoles.map((r) => String(r).toLowerCase().replace(/[_-]/g, ' ').trim())
    const isAssetOfficer = normalized.includes('asset officer')
    if (!isAssetOfficer) {
      throw new ForbiddenException('Only Asset Officer can accept overtime requests')
    }
    const updated = await this.workflow.updateOvertimeRequestAcceptance(id, 'ACCEPTED', req.user?.userId)
    return { ok: true, data: updated }
  }

  @UseGuards(JwtAuthGuard)
  @Get('user-notifications')
  async getUserNotifications(@Request() req: any) {
    const user = req.user as { userId: string };
    const data = await this.workflow.getUserNotifications(user.userId);
    return { ok: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post('overtime/:id/not-accept')
  async notAcceptOvertimeRequestByHR(@Param('id') id: string, @Request() req: any) {
    const rawRoles: string[] = Array.isArray(req.user?.roles)
      ? (req.user.roles as string[])
      : ((req.user?.role ? [req.user.role] : []) as string[])
    const normalized = rawRoles.map((r) => String(r).toLowerCase().replace(/[_-]/g, ' ').trim())
    const isAssetOfficer = normalized.includes('asset officer')
    if (!isAssetOfficer) {
      throw new ForbiddenException('Only Asset Officer can not-accept overtime requests')
    }
    const updated = await this.workflow.updateOvertimeRequestAcceptance(id, 'NOT_ACCEPTED', req.user?.userId)
    return { ok: true, data: updated }
  }

  // Overtime Requests
@UseGuards(JwtAuthGuard)
@Get('overtime-requests')
async getOvertimeRequests(@Request() req: any) {
  const userId = req.user?.userId as string | undefined;
  const departmentId = req.user?.departmentId as string | undefined;

  if (!userId) {
    throw new BadRequestException('Missing authenticated user');
  }

  // Return strictly the current user's requests
  const data = await this.workflow.findMyOvertimeRequests(userId, departmentId);

  return {
    ok: true,
    data,
    userId,
    departmentId,
  };
}

  // Other Overtime Requests in same department (excluding requester) — Department Head only
  @UseGuards(JwtAuthGuard)
  @Get('overtime-requests/others')
  async getOtherDepartmentOvertimeRequests(@Request() req: any) {
    const primaryRole = (req.user?.role || '').toLowerCase()
    const roles: string[] = Array.isArray(req.user?.roles)
      ? req.user.roles.map((r: string) => String(r).toLowerCase())
      : (primaryRole ? [primaryRole] : [])

    const isDeptHead =
      roles.includes('department_head') ||
      roles.includes('department-head') ||
      roles.includes('dept_head') ||
      roles.includes('departmenthead') ||
      roles.includes('department head')

    if (!isDeptHead) {
      throw new ForbiddenException('Only Department Head can access other overtime requests')
    }

    const userId = req.user?.userId as string | undefined
    const departmentId = req.user?.departmentId as string | undefined
    if (!userId) throw new BadRequestException('Missing authenticated user')

    const data = await this.workflow.findOtherDepartmentOvertimeRequests({ id: userId, departmentId })
    return { ok: true, data }
  }


  @UseGuards(JwtAuthGuard)
  @Post('overtime-requests')
  async createOvertimeRequest(@Body() body: any, @Request() req: any) {
    const user = req.user
    const payload = {
      reqId: body?.reqId ?? user?.userId,
      departmentId: body?.departmentId ?? user?.departmentId ?? undefined,
      overtimeType: body?.overtimeType,
      durationType: body?.durationType,
      startTime: body?.startTime ?? null,
      endTime: body?.endTime ?? null,
      dates: Array.isArray(body?.dates) ? body.dates : [],
      description: body?.description ?? undefined,
    }

    if (!payload.reqId) {
      throw new BadRequestException('reqId is required and will be derived from the authenticated user. Ensure you are logged in or provide reqId explicitly.')
    }

    const created = await this.workflow.createOvertimeRequest(payload)
    return { ok: true, data: created }
  }

  @Get('overtime-requests/:id')
  getOvertimeRequest(@Param('id') id: string) {
    return { ok: true, data: { id }, message: 'Overtime request detail placeholder' }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('overtime-requests/:id')
  async updateOvertimeRequest(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    const status = body?.status as 'APPROVED' | 'REJECTED' | undefined
    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      throw new BadRequestException("Missing or invalid status. Use 'APPROVED' | 'REJECTED'.")
    }

    const rawRoles: string[] = Array.isArray(req.user?.roles)
      ? req.user.roles as string[]
      : ((req.user?.role ? [req.user.role] : []) as string[])
    const normalized = rawRoles.map(r => String(r).toLowerCase().replace(/[_-]/g, ' ').trim())
    const isDeptHead = normalized.includes('department head')

    if (!isDeptHead) {
      throw new ForbiddenException('Only Department Head can approve/reject overtime requests')
    }

    const updated = await this.workflow.updateOvertimeRequestStatus(id, status, req.user?.userId)
    return { ok: true, data: updated, reqrole: req.user?.role }
  }

  // HR: Fetch APPROVED overtime requests (notifications view)
  @UseGuards(JwtAuthGuard)
  @Get('hr/overtime-requests/approved')
  async getApprovedOvertimeRequests(@Request() req: any) {
    const rawRoles: string[] = Array.isArray(req.user?.roles)
      ? (req.user.roles as string[])
      : ((req.user?.role ? [req.user.role] : []) as string[])
    const normalized = rawRoles.map((r) => String(r).toLowerCase().replace(/[_-]/g, ' ').trim())
    const isAssetOfficer = normalized.includes('asset officer')
    if (!isAssetOfficer) {
      throw new ForbiddenException('Only Asset Officer can view approved overtime requests')
    }

    const data = await this.workflow.getApprovedOvertimeRequests()
    return { ok: true, data }
  }

  @Delete('overtime-requests/:id')
  removeOvertimeRequest(@Param('id') id: string) {
    return { ok: true, id, message: 'Overtime request delete placeholder' }
  }

  @Post('overtime-requests/:id/approve')
  approveOvertimeRequest(@Param('id') id: string) {
    return { ok: true, id, status: 'APPROVED', message: 'Overtime request approve placeholder' }
  }

  //-----------------------Report-----------------------
   @Get('combined-overview')
  async getCombinedOverview() {
    return this.workflow.getCombinedOverview();
  }

  @Get('field-request-summary')
  async getFieldRequestSummary() {
    return this.workflow.getFieldRequestSummary();
  }

  @Get('field-requests-by-type')
  async getFieldRequestsByType() {
    return this.workflow.getFieldRequestsByType();
  }

  @Get('field-requests-over-time')
  async getFieldRequestsOverTime(@Query('days') days: string) {
    const daysNumber = days ? parseInt(days) : 30;
    return this.workflow.getFieldRequestsOverTime(daysNumber);
  }

  @Get('overtime-request-summary')
  async getOvertimeRequestSummary() {
    return this.workflow.getOvertimeRequestSummary();
  }

  @Get('overtime-requests-by-type')
  async getOvertimeRequestsByType() {
    return this.workflow.getOvertimeRequestsByType();
  }

  @Get('overtime-requests-by-duration')
  async getOvertimeRequestsByDuration() {
    return this.workflow.getOvertimeRequestsByDuration();
  }
}
