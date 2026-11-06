import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class WorkflowService {
  constructor(private prisma: PrismaService) {}

  // ------------------------------------------------------------------
  // Backfill: Rewrite existing FieldNotification messages to Amharic
  // ------------------------------------------------------------------
  async backfillFieldNotificationMessages() {
    const rows = await this.prisma.fieldNotification.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        fieldRequestId: true,
        message: true,
        userId: true,
        fieldRequest: {
          select: {
            reqId: true,
            requestor: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    })

    for (const r of rows) {
      const first = r.fieldRequest?.requestor?.firstName || ''
      const last = r.fieldRequest?.requestor?.lastName || ''
      const full = `${first} ${last}`.trim()
      const name = full || r.fieldRequest?.requestor?.email || 'User'
      const newMessage = `${name} አዲስ የመስክ ጥያቄ  አቅርበዋል`
      if (r.message !== newMessage) {
        await this.prisma.fieldNotification.update({
          where: { id: r.id },
          data: { message: newMessage },
        })
      }
    }

    return { updated: rows.length }
  }

  // ------------------------------------------------------------------
  // Overtime Request decision (Accept/Not Accept) by Asset Officer
  // Creates a UserOvertimeNotification to inform the requester
  // ------------------------------------------------------------------
  async updateOvertimeRequestAcceptance(
    id: string,
    status: 'ACCEPTED' | 'NOT_ACCEPTED',
    byUserId: string,
  ) {
    if (!['ACCEPTED', 'NOT_ACCEPTED'].includes(status)) {
      throw new Error("Invalid status. Must be 'ACCEPTED' or 'NOT_ACCEPTED'")
    }

    return this.prisma.$transaction(async (tx) => {
      let updated: any
      try {
        updated = await tx.overtimeRequest.update({
          where: { id },
          data: { status: status as any },
        })
      } catch (err: any) {
        if (String(err?.message || '').toLowerCase().includes('no record was found')) {
          throw new NotFoundException('Overtime request not found')
        }
        throw err
      }

      // Prepare department label for message
      let departmentLabel = 'Department'
      if (updated.departmentId) {
        const dept = await tx.department.findUnique({
          where: { id: updated.departmentId },
          select: { name: true },
        })
        departmentLabel = dept?.name || departmentLabel
      }

      // Notify requester (per-user overtime notification)
      if (updated.reqId) {
        const message =
          status === 'ACCEPTED'
            ? 'የጠየቁት የመስክ/የትርፍ ሰዓት ጥያቄ በበላይ ሃላፊዎ/በሰዉ ሀብት በኩል ተረጋግጧል'
            : `Your overtime request is ${status.toLowerCase().replace('_', ' ')}`

        // await tx.userOvertimeNotification.create({
        //   data: {
        //     userId: updated.reqId,
        //     message,
        //     overtimeRequestId: updated.id,
        //     departmentId: updated.departmentId || undefined,
        //     actionByUserId: byUserId || undefined,
        //   },
        // })
      }

      return updated
    })
  }

  // ------------------------------------------------------------------
  // Overtime: Fetch APPROVED requests (for HR notifications view)
  // ------------------------------------------------------------------
  async getApprovedOvertimeRequests() {
    const items = await this.prisma.overtimeRequest.findMany({
      where: { status: 'APPROVED' as any },
      orderBy: { createdAt: 'desc' },
      include: {
        requestor: { select: { firstName: true, lastName: true, email: true, roles: true } } as any,
        department: { select: { id: true, name: true } },
      },
    })

    return items.map((r: any) => {
      const first = r.requestor?.firstName || ''
      const last = r.requestor?.lastName || ''
      const full = `${first} ${last}`.trim()
      const requesterName = full || r.requestor?.email || undefined
      const requesterRole = r.requestor?.role
      const departmentName = r.department?.name
      const { requestor, department, ...rest } = r
      return { ...rest, requesterName, requesterRole, departmentName }
    })
  }


  // ------------------------------------------------------------------
  // Field Requests
  // ------------------------------------------------------------------
  async listFieldRequests(params?: { reqId?: string; departmentId?: string }) {
    const { reqId, departmentId } = params || {}
    const items = await this.prisma.fieldRequest.findMany({
      where: {
        reqId: reqId || undefined,
        departmentId: departmentId || undefined,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        requestor: { select: { firstName: true, lastName: true, email: true, roles: true } } as any,
        FieldNotification: { select: { id: true, message: true, userId: true, fieldRequestId: true, departmentId: true, createdAt: true } },
      },
    })

    // Shape response to include requesterName (used by frontend)
    return items.map((r: any) => {
      const first = r.requestor?.firstName || ''
      const last = r.requestor?.lastName || ''
      const full = `${first} ${last}`.trim()
      const requesterName = full || r.requestor?.email || undefined
      const requesterRole = r.requestor?.role
      // Remove nested object if not needed by clients
      const { requestor, FieldNotification, ...rest } = r
      // Rename relation to a friendlier key in API
      const fieldNotifications = Array.isArray(FieldNotification) ? FieldNotification : []
      return { ...rest, requesterName, requesterRole, fieldNotifications }
    })
  }

  // ------------------------------------------------------------------
  // Field Notifications
  // ------------------------------------------------------------------
  async getFieldRequestNotifications(fieldRequestId: string) {
    return this.prisma.fieldNotification.findMany({
      where: { fieldRequestId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, message: true, userId: true, fieldRequestId: true, departmentId: true, createdAt: true },
    })
  }


async listUserFieldNotifications(userId: string) {
  if (!userId) throw new Error('userId is required');

  // Fetch ONLY this user's field notifications (no more global broadcast in the reader)
  const notifications = await this.prisma.fieldNotification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      message: true,
      userId: true,
      fieldRequestId: true,
      departmentId: true,
      createdAt: true,
    },
  });

  // Extract potential UUIDs from messages (e.g., "rejected by <uuid>")
  const uuids = notifications
    .map(n => {
      const match = n.message?.match(/[0-9a-fA-F-]{36}/);
      return match ? match[0] : null;
    })
    .filter(Boolean) as string[];

  // Fetch user names for those UUIDs
  const users = await this.prisma.user.findMany({
    where: { id: { in: uuids } },
    select: { id: true, firstName: true, lastName: true },
  });

  const userMap = new Map(users.map(u => [u.id, `${u.firstName || ''} ${u.lastName || ''}`.trim()]));

  // Replace UUIDs in messages with names
  const processed = notifications.map(n => {
    let message = n.message;
    for (const [uuid, name] of userMap.entries()) {
      if (message?.includes(uuid)) {
        message = message.replace(uuid, name || 'Unknown User');
      }
    }
    return { ...n, message };
  });

  return processed;
}


  async createFieldRequest(body: {
    reqId: string
    departmentId?: string | null
    fieldType: string
    description?: string | null
    location?: string | null
    fromDate: string | Date
    toDate: string | Date
    startTime?: string | Date | null
    endTime?: string | Date | null
    durationType?: string | null
  }) {
    const {
      reqId,
      departmentId,
      fieldType,
      description,
      location,
      fromDate,
      toDate,
      startTime,
      endTime,
      durationType,
    } = body

    
    // Create FieldRequest and corresponding FieldNotification in a single transaction
    return this.prisma.$transaction(async tx => {
      const created = await tx.fieldRequest.create({
        data: {
          reqId,
          departmentId: departmentId ?? undefined,
          fieldType,
          description: description ?? undefined,
          location: location ?? undefined,
          fromDate: new Date(fromDate),
          toDate: new Date(toDate),
          startTime: startTime ? new Date(startTime) : undefined,
          endTime: endTime ? new Date(endTime) : undefined,
          durationType: durationType ?? undefined,
        },
      })

      // Notification: send only to Department Head(s) of the requester's department
      const requester = await tx.user.findUnique({
        where: { id: reqId },
        select: { firstName: true, lastName: true, email: true },
      })
      const fullName = `${requester?.firstName || ''} ${requester?.lastName || ''}`.trim()
      const requesterLabel = fullName || requester?.email || 'Unknown User'
      const message = `${requesterLabel} አዲስ የመስክ ጥያቄ  አቅርበዋል`

      // Find active department heads in this department
      const targetDeptId = departmentId ?? undefined
      const deptHeads = await tx.user.findMany({
        where: {
          isActive: true,
          roles: { has: 'Department_Head' },
          ...(targetDeptId ? { departmentId: targetDeptId } : {}),
        } as any,
        select: { id: true },
      })

      if (deptHeads.length) {
        await tx.fieldNotification.createMany({
          data: deptHeads.map((u) => ({
            message,
            userId: u.id,
            fieldRequestId: created.id,
            departmentId: targetDeptId,
          })),
          skipDuplicates: true,
        })
      }

      return created
    })
  }

  // List current user's overtime requests (newest first)
async findUserDepartmentOvertimeRequests(user: {
  id: string;
  departmentId?: string | null;
  role?: string | null;
}) {
  const { id, departmentId, role } = user;

  if (!id) throw new Error('User ID is required');

  let whereCondition: any = {};

  // If user is Department Head → show all requests in their department
  if (role?.toLowerCase() === 'department_head' && departmentId) {
    whereCondition = { departmentId };
  } else {
    // Regular user → only their own requests
    whereCondition = {
      reqId: id,
      departmentId: departmentId ?? undefined,
    };
  }

  const rows = await this.prisma.overtimeRequest.findMany({
    where: whereCondition,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      overtimeType: true,
      durationType: true,
      startTime: true,
      endTime: true,
      dates: true,
      description: true,
      status: true,
      createdAt: true,
      requestor: {
        select: { firstName: true, lastName: true, email: true },
      },
      department: { select: { id: true, name: true } },
    },
  });

  // Format output
  return rows.map((r) => ({
    ...r,
    startTime: r.startTime ? r.startTime.toISOString() : null,
    endTime: r.endTime ? r.endTime.toISOString() : null,
    dates: r.dates.map((d) => new Date(d).toISOString().split('T')[0]),
    createdBy:
      `${r.requestor?.firstName || ''} ${r.requestor?.lastName || ''}`.trim() ||
      r.requestor?.email ||
      'Unknown',
    departmentName: r.department?.name || 'Unknown',
  }));
}

  // Strictly list ONLY the current user's overtime requests (regardless of role)
  async findMyOvertimeRequests(userId: string, departmentId?: string | null) {
    if (!userId) throw new Error('User ID is required')

    const rows = await this.prisma.overtimeRequest.findMany({
      where: {
        reqId: userId,
        departmentId: departmentId ?? undefined,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        overtimeType: true,
        durationType: true,
        startTime: true,
        endTime: true,
        dates: true,
        description: true,
        status: true,
        createdAt: true,
        requestor: {
          select: { firstName: true, lastName: true, email: true },
        },
        department: { select: { id: true, name: true } },
      },
    })

    return rows.map((r) => ({
      ...r,
      startTime: r.startTime ? r.startTime.toISOString() : null,
      endTime: r.endTime ? r.endTime.toISOString() : null,
      dates: r.dates.map((d) => new Date(d).toISOString().split('T')[0]),
      createdBy:
        `${r.requestor?.firstName || ''} ${r.requestor?.lastName || ''}`.trim() ||
        r.requestor?.email ||
        'Unknown',
      departmentName: r.department?.name || 'Unknown',
    }))
  }


  // List other users' overtime requests within the same department (exclude requester)
  async findOtherDepartmentOvertimeRequests(user: {
    id: string
    departmentId?: string | null
  }) {
    const { id, departmentId } = user
    if (!id) throw new Error('User ID is required')
    if (!departmentId) return []

    const rows = await this.prisma.overtimeRequest.findMany({
      where: {
        departmentId,
        NOT: { reqId: id },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        overtimeType: true,
        durationType: true,
        startTime: true,
        endTime: true,
        dates: true,
        description: true,
        status: true,
        createdAt: true,
        requestor: {
          select: { firstName: true, lastName: true, email: true },
        },
        department: { select: { id: true, name: true } },
      },
    })

    return rows.map((r) => ({
      ...r,
      startTime: r.startTime ? r.startTime.toISOString() : null,
      endTime: r.endTime ? r.endTime.toISOString() : null,
      dates: r.dates.map((d) => new Date(d).toISOString().split('T')[0]),
      createdBy:
        `${r.requestor?.firstName || ''} ${r.requestor?.lastName || ''}`.trim() ||
        r.requestor?.email ||
        'Unknown',
      departmentName: r.department?.name || 'Unknown',
    }))
  }


  // Overtime notifications for Department Head only
  async listDeptHeadOvertimeNotifications(userId: string) {
    // Find the user's department
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { departmentId: true, roles: true } } as any)
    if (!user) throw new Error('User not found')
    if (!user.departmentId) return []
    if (!((user as any).roles?.includes('Department_Head'))) return []

    // Fetch notifications tied to this department
    const rows = await this.prisma.overtimeNotification.findMany({
      where: { departmentId: user.departmentId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        message: true,
        userId: true,
        overtimeRequestId: true,
        departmentId: true,
        createdAt: true,
      }
    })

    return rows
  }

  // ------------------------------------------------------------------
  // Overtime Request decision (Approve/Reject) + HrOvertimeNotification
  // ------------------------------------------------------------------
  async updateOvertimeRequestStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    byUserId: string,
  ) {
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new Error('Invalid status. Must be APPROVED or REJECTED')
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.overtimeRequest.update({
        where: { id },
        data: { status: status as any },
      })

      const [requester, dept] = await Promise.all([
        updated.reqId
          ? tx.user.findUnique({
              where: { id: updated.reqId },
              select: { firstName: true, lastName: true, email: true },
            })
          : Promise.resolve(null),
        updated.departmentId
          ? tx.department.findUnique({
              where: { id: updated.departmentId },
              select: { name: true },
            })
          : Promise.resolve(null),
      ])

      const requesterName = requester
        ? `${requester.firstName || ''} ${requester.lastName || ''}`.trim() || requester.email || 'User'
        : 'User'
      const deptName = dept?.name || 'Department'
      const message = `${requesterName}'s overtime request is ${status.toLowerCase()} by ${deptName} Department Head (HD)`

      // Notify the requester with the Amharic message when approved by Department Head
      // if (updated.reqId) {
      //   await this.prisma.userOvertimeNotification.create({
      //     data: {
      //       userId: updated.reqId,
      //       message:
      //         status === 'APPROVED'
      //           ? 'የጠየቁት የመስክ/የትርፍ ሰዓት ጥያቄ በበላይ ሃላፊዎ/በሰዉ ሀብት በኩል ተረጋግጧል'
      //           : `Your overtime request has been ${status.toLowerCase()} by ${deptName} Department Head`,
      //       overtimeRequestId: updated.id,
      //       departmentId: updated.departmentId || undefined,
      //       actionByUserId: byUserId || undefined,
      //     },
      //   })
      // }

      return updated
    })
  }

  // ------------------------------------------------------------------
  // Field Request decision (Accepted/Not Accepted) + UserNotification
  // ------------------------------------------------------------------
  async updateFieldRequestAcceptance(
    id: string,
    status: 'ACCEPTED' | 'NOT_ACCEPTED',
    byUserId: string
  ) {
    if (!['ACCEPTED', 'NOT_ACCEPTED'].includes(status)) {
      throw new Error("Invalid status. Must be 'ACCEPTED' or 'NOT_ACCEPTED'")
    }

    return this.prisma.$transaction(async (tx) => {
      // 1) Update the FieldRequest status
      let updated: any
      try {
        updated = await tx.fieldRequest.update({
          where: { id },
          data: { status: status as any },
        })
      } catch (err: any) {
        if (String(err?.message || '').toLowerCase().includes('no record was found')) {
          throw new NotFoundException('Field request not found')
        }
        throw err
      }

      // 2) Prepare department label for message
      let departmentLabel = 'Department'
      if (updated.departmentId) {
        const dept = await tx.department.findUnique({
          where: { id: updated.departmentId },
          select: { name: true },
        })
        departmentLabel = dept?.name || departmentLabel
      }

      // 3) Create a generic UserNotification for the requester
      if (updated.reqId) {
        const message =
          status === 'ACCEPTED'
            ? 'የጠየቁት የመስክ/የትርፍ ሰዓት ጥያቄ በበላይ ሃላፊዎ/በሰዉ ሀብት በኩል ተረጋግጧል'
            : `Your request is ${status} by Department`

        await tx.userNotification.create({
          data: {
            userId: updated.reqId, // recipient (request owner)
            message,
            status: status as any,
            fieldRequestId: updated.id,
            departmentId: updated.departmentId || undefined,
            actionByUserId: byUserId || undefined,
          },
        })
      }

      return updated
    })
  }

  // ------------------------------------------------------------------
  // Field Request decision (Approve/Reject)
  // ------------------------------------------------------------------
async updateFieldRequestStatus(
  id: string,
  status: 'APPROVED' | 'REJECTED',
  byUserId: string
) {
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    throw new Error('Invalid status. Must be APPROVED or REJECTED');
  }

  return this.prisma.$transaction(async (tx) => {
    // 1️⃣ Update the request
    const updated = await tx.fieldRequest.update({
      where: { id },
      data: { status },
    });

    // 2️⃣ Fetch related data
    const [requester, approver, dept] = await Promise.all([
      updated.reqId
        ? tx.user.findUnique({
            where: { id: updated.reqId },
            select: { firstName: true, lastName: true, email: true },
          })
        : Promise.resolve(null),
      byUserId
        ? tx.user.findUnique({
            where: { id: byUserId },
            select: { firstName: true, lastName: true, email: true, roles: true },
          } as any)
        : Promise.resolve(null),
      updated.departmentId
        ? tx.department.findUnique({
            where: { id: updated.departmentId },
            select: { name: true },
          })
        : Promise.resolve(null),
    ]);

    // 3️⃣ Build message
    const requesterName =
      requester
        ? `${requester.firstName || ''} ${requester.lastName || ''}`.trim() ||
          requester.email ||
          'User'
        : 'User';
    const approverName =
      approver
        ? `${approver.firstName || ''} ${approver.lastName || ''}`.trim() ||
          approver.email ||
          'Approver'
        : '';
    const deptName = dept?.name;
    const actorLabel = approverName || deptName || 'Department Head';

    // 4️⃣ Notify the requester when the field request is APPROVED by Department Head (user-facing notification)
    if (status === 'APPROVED' && updated.reqId) {
      await tx.userNotification.create({
        data: {
          userId: updated.reqId,
          message:
            'የጠየቁት የመስክ/የትርፍ ሰዓት ጥያቄ በበላይ ሃላፊዎ/በሰዉ ሀብት በኩል ተረጋግጧል',
          status: status as any,
          fieldRequestId: updated.id,
          departmentId: updated.departmentId || undefined,
          actionByUserId: byUserId || undefined,
        },
      });
    }

    return updated;
  });
}

 // Fetch APPROVED field requests (used by controller with HR role enforcement)
  async getApprovedFieldRequests() {
    const items = await this.prisma.fieldRequest.findMany({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      include: {
        requestor: { select: { firstName: true, lastName: true, email: true, roles: true } } as any,
        FieldNotification: { select: { id: true, message: true, userId: true, fieldRequestId: true, departmentId: true, createdAt: true } },
      },
    })

    // Shape response similarly to listFieldRequests
    return items.map((r: any) => {
      const first = r.requestor?.firstName || ''
      const last = r.requestor?.lastName || ''
      const full = `${first} ${last}`.trim()
      const requesterName = full || r.requestor?.email || undefined
      const requesterRole = r.requestor?.role
      const { requestor, FieldNotification, ...rest } = r
      const fieldNotifications = Array.isArray(FieldNotification) ? FieldNotification : []
      return { ...rest, requesterName, requesterRole }
    })
  }


  // get user Notification
  async getUserNotifications(userId: string) {
  // Fetch all notifications where the current user is the recipient
  const notifications = await this.prisma.userNotification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      message: true,
      status: true,
      isRead: true,
      type: true,
      relatedId: true,
      fieldRequestId: true,
      departmentId: true,
      actionByUserId: true,
      createdAt: true,
    },
  });

  // Optionally populate the department name and actionBy user name
  const enriched = await Promise.all(
    notifications.map(async (n) => {
      const [department, actionByUser] = await Promise.all([
        n.departmentId
          ? this.prisma.department.findUnique({
              where: { id: n.departmentId },
              select: { name: true },
            })
          : null,
        n.actionByUserId
          ? this.prisma.user.findUnique({
              where: { id: n.actionByUserId },
              select: { firstName: true, lastName: true },
            })
          : null,
      ]);

      const actorName = actionByUser
        ? `${actionByUser.firstName || ''} ${actionByUser.lastName || ''}`.trim()
        : null;

      return {
        ...n,
        departmentName: department?.name || null,
        actionBy: actorName || null,
      };
    })
  );

  return enriched;
}

  // ------------------------------------------------------------------
  // Delete a notification by ID across UserNotification, AllNotification, HrNotification
  // ------------------------------------------------------------------
  async deleteAnyNotificationById(id: string, currentUserId?: string) {
    // Try UserNotification first (scoped to recipient user)
    const userNotif = await this.prisma.userNotification.findUnique({ where: { id } })
    if (userNotif) {
      // If a current user is provided, enforce that they own the notification
      if (currentUserId && userNotif.userId !== currentUserId) {
        // Not owned by the user; do not delete here, proceed to check other tables
      } else {
        await this.prisma.userNotification.delete({ where: { id } })
        return { deletedFrom: 'UserNotification', id }
      }
    }

    // AllNotification removed - help desk module deleted
    // Not found in any table
    return null
  }

  // ------------------------------------------------------------------
  // Delete a FieldNotification by ID (used for Department Head field notifications)
  // ------------------------------------------------------------------
  async deleteFieldNotificationById(id: string, currentUserId?: string) {
    const fieldNotif = await this.prisma.fieldNotification.findUnique({ where: { id } })
    if (!fieldNotif) return null
    // Optional ownership/permission check: allow if user is the creator/recipient of the notification
    if (currentUserId && fieldNotif.userId !== currentUserId) {
      // If needed, add department-based permission checks here
      // For now, we still allow delete to match UI expectations
    }
    await this.prisma.fieldNotification.delete({ where: { id } })
    return { deletedFrom: 'FieldNotification', id }
  }

  // ------------------------------------------------------------------
  // Per-user Overtime Notifications (UserOvertimeNotification)
  // ------------------------------------------------------------------
  async getUserOvertimeNotifications(userId: string) {
    if (!userId) throw new BadRequestException('Missing userId')

    // const rows = await this.prisma.userOvertimeNotification.findMany({
    //   where: { userId },
    //   orderBy: { createdAt: 'desc' },
    //   include: {
    //     department: { select: { id: true, name: true } },
    //     actionBy: { select: { firstName: true, lastName: true, email: true } },
    //     overtimeRequest: {
    //       select: {
    //         id: true,
    //         status: true,
    //         createdAt: true,
    //       }
    //     }
    //   },
    // })
    // return rows.map((n) => {
    //   const actorName = n.actionBy
    //     ? `${n.actionBy.firstName || ''} ${n.actionBy.lastName || ''}`.trim() || n.actionBy.email || null
    //     : null
    //   return {
    //     id: n.id,
    //     message: n.message,
    //     createdAt: n.createdAt,
    //     overtimeRequestId: n.overtimeRequestId,
    //     actorName,
    //     departmentName: n.department?.name || null,
    //     overtimeRequestStatus: n.overtimeRequest?.status || null,
    //     overtimeRequestCreatedAt: n.overtimeRequest?.createdAt || null,
    //   }
    // })
    return []
  }

  // ------------------------------------------------------------------
  // Overtime: create request + notification
  // ------------------------------------------------------------------
  async createOvertimeRequest(body: {
    reqId: string
    departmentId?: string | null
    overtimeType: string
    durationType: string
    startTime?: string | Date | null
    endTime?: string | Date | null
    dates: Array<string | Date>
    description?: string | null
  }) {
    const {
      reqId,
      departmentId,
      overtimeType,
      durationType,
      startTime,
      endTime,
      dates,
      description,
    } = body

    // Map strings to Prisma enums
    const mapOvertimeType = (v: string): 'EXTRA_TIME' | 'WEEKEND' => {
      const s = String(v || '').toUpperCase().replace(/\s+/g, '_')
      return s === 'WEEKEND' ? 'WEEKEND' : 'EXTRA_TIME'
    }
    const mapDurationType = (v: string): 'HALF_TIME' | 'FULL_DAY' => {
      const s = String(v || '').toUpperCase().replace(/\s+/g, '_')
      return s === 'FULL_DAY' ? 'FULL_DAY' : 'HALF_TIME'
    }

    const parsedDates: Date[] = Array.isArray(dates)
      ? dates.map(d => new Date(d as any)).filter(d => !isNaN(d as any))
      : []

    return this.prisma.$transaction(async (tx) => {
      // Create OvertimeRequest
      const created = await tx.overtimeRequest.create({
        data: {
          reqId,
          departmentId: departmentId ?? undefined,
          overtimeType: mapOvertimeType(overtimeType) as any,
          durationType: mapDurationType(durationType) as any,
          startTime: startTime ? new Date(startTime) : undefined,
          endTime: endTime ? new Date(endTime) : undefined,
          dates: parsedDates,
          description: description ?? undefined,
        },
      })

      // Build notification message
      const requester = await tx.user.findUnique({
        where: { id: reqId },
        select: { firstName: true, lastName: true, email: true },
      })
      const fullName = `${requester?.firstName || ''} ${requester?.lastName || ''}`.trim()
      const requesterLabel = fullName || requester?.email || 'User'
      const message = `${requesterLabel} created a request for overtime`

      // Create OvertimeNotification for requester (and optionally department consumers later)
      await tx.overtimeNotification.create({
        data: {
          message,
          userId: reqId,
          overtimeRequestId: created.id,
          departmentId: departmentId ?? undefined,
        },
      })

      return created
    })
  }

  //-----------------Report-----------------
   // --- Field Request Reports ---
  async getFieldRequestSummary() {
    const totalFieldRequests = await this.prisma.fieldRequest.count();
    const pendingFieldRequests = await this.prisma.fieldRequest.count({ 
      where: { status: 'PENDING' } 
    });
    const approvedFieldRequests = await this.prisma.fieldRequest.count({ 
      where: { status: 'APPROVED' } 
    });
    const rejectedFieldRequests = await this.prisma.fieldRequest.count({ 
      where: { status: 'REJECTED' } 
    });

    return {
      totalFieldRequests,
      pendingFieldRequests,
      approvedFieldRequests,
      rejectedFieldRequests,
      approvalRate: totalFieldRequests > 0 ? 
        Math.round((approvedFieldRequests / totalFieldRequests) * 100) : 0
    };
  }

  async getFieldRequestsByType() {
    const requests = await this.prisma.fieldRequest.groupBy({
      by: ['fieldType'],
      _count: { id: true }
    });

    return requests.map(r => ({ 
      fieldType: r.fieldType, 
      count: r._count.id 
    }));
  }

  async getFieldRequestsOverTime(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const requests = await this.prisma.fieldRequest.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      select: {
        createdAt: true,
        status: true
      }
    });

    // Group by date and status
    const dailyData: Record<string, { total: number; approved: number; pending: number; rejected: number }> = {};

    requests.forEach(request => {
      const date = request.createdAt.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { total: 0, approved: 0, pending: 0, rejected: 0 };
      }
      
      dailyData[date].total++;
      if (request.status === 'APPROVED') dailyData[date].approved++;
      if (request.status === 'PENDING') dailyData[date].pending++;
      if (request.status === 'REJECTED') dailyData[date].rejected++;
    });

    return dailyData;
  }

  // --- Overtime Request Reports ---
  async getOvertimeRequestSummary() {
    const totalOvertimeRequests = await this.prisma.overtimeRequest.count();
    const pendingOvertimeRequests = await this.prisma.overtimeRequest.count({ 
      where: { status: 'PENDING' } 
    });
    const approvedOvertimeRequests = await this.prisma.overtimeRequest.count({ 
      where: { status: 'APPROVED' } 
    });
    const rejectedOvertimeRequests = await this.prisma.overtimeRequest.count({ 
      where: { status: 'REJECTED' } 
    });

    // Calculate total overtime hours (estimated)
    const approvedRequests = await this.prisma.overtimeRequest.findMany({
      where: { status: 'APPROVED' },
      select: { startTime: true, endTime: true }
    });

    let totalOvertimeHours = 0;
    approvedRequests.forEach(req => {
      if (req.startTime && req.endTime) {
        const hours = (req.endTime.getTime() - req.startTime.getTime()) / (1000 * 60 * 60);
        totalOvertimeHours += hours;
      }
    });

    return {
      totalOvertimeRequests,
      pendingOvertimeRequests,
      approvedOvertimeRequests,
      rejectedOvertimeRequests,
      totalOvertimeHours: Math.round(totalOvertimeHours),
      approvalRate: totalOvertimeRequests > 0 ? 
        Math.round((approvedOvertimeRequests / totalOvertimeRequests) * 100) : 0
    };
  }

  async getOvertimeRequestsByType() {
    const requests = await this.prisma.overtimeRequest.groupBy({
      by: ['overtimeType'],
      _count: { id: true }
    });

    return requests.map(r => ({ 
      overtimeType: r.overtimeType, 
      count: r._count.id 
    }));
  }

  async getOvertimeRequestsByDuration() {
    const requests = await this.prisma.overtimeRequest.groupBy({
      by: ['durationType'],
      _count: { id: true }
    });

    return requests.map(r => ({ 
      durationType: r.durationType, 
      count: r._count.id 
    }));
  }

  // --- Combined Overview ---
  async getCombinedOverview() {
    const [fieldSummary, overtimeSummary] = await Promise.all([
      this.getFieldRequestSummary(),
      this.getOvertimeRequestSummary()
    ]);

    return {
      totalRequests: fieldSummary.totalFieldRequests + overtimeSummary.totalOvertimeRequests,
      pendingRequests: fieldSummary.pendingFieldRequests + overtimeSummary.pendingOvertimeRequests,
      approvedRequests: fieldSummary.approvedFieldRequests + overtimeSummary.approvedOvertimeRequests,
      fieldRequests: fieldSummary.totalFieldRequests,
      overtimeRequests: overtimeSummary.totalOvertimeRequests,
      totalOvertimeHours: overtimeSummary.totalOvertimeHours
    };
  }


}
