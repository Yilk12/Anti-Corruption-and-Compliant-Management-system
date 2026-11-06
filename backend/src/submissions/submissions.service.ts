import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { SubmissionType } from '../common/enums/submission-type.enum';

export type CreateSubmissionInput = {
  userId?: string | null;
  recipientUserId?: string | null;
  departmentId?: string | null;
  anonymous?: boolean;
  type: SubmissionType;
  message: string;
};

export type CreateWomenadnSocilaInclusionInput = {
  typeOfMisconduct: string;
  dateTime: Date;
  location?: string | null;
  detailDescriptionOfIncident?: string | null;
  reportedBefore: boolean;
  medicalHelpNeeded: boolean;
  fileUrl?: string | null;
  victimId?: string | null;
  departmentId?: string | null;
  userId?: string | null;
};

export type CreateThirdPartySexualAssaultInput = {
  misconductId: string;
  typeOfMisconduct: string;
  dateTime: Date;
  location?: string | null;
  descriptionOfWhatWasObserved?: string | null;
  victimUserId?: string | null;
};

@Injectable()
export class SubmissionsService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateSubmissionInput) {
    const { userId, recipientUserId, departmentId } = input;

    // Validate provided foreign keys
    if (departmentId) {
      const dep = await this.prisma.department.findUnique({ where: { id: departmentId } });
      if (!dep) throw new BadRequestException('Department not found');
    }

    if (recipientUserId) {
      const user = await this.prisma.user.findUnique({ where: { id: recipientUserId } });
      if (!user) throw new BadRequestException('Recipient user not found');
    }

    // 🔹 Connect user only when not anonymous and we have a userId
    const data: any = {
      user:  userId ? { connect: { id: userId } } : undefined,
      recipientUser: recipientUserId ? { connect: { id: recipientUserId } } : undefined,
      department: departmentId ? { connect: { id: departmentId } } : undefined,
      anonymous: Boolean(input.anonymous),
      type: input.type,
      message: input.message,
    };

  try {
    const submission = await this.prisma.submission.create({ data });

    // Create notifications for complaints and suggestions
    if (input.type === SubmissionType.COMPLAINT || input.type === SubmissionType.SUGGESTION) {
      try {
        const targets: string[] = [];

        // 1) Direct recipient if provided
        if (recipientUserId) {
          targets.push(recipientUserId);
        } else if (departmentId) {
          // 2) Department heads for the department
          const deptHeads = await this.prisma.user.findMany({
            where: {
              departmentId,
              roles: { has: 'Department_Head' },
              isActive: true,
            } as any,
            select: { id: true },
          });
          targets.push(...deptHeads.map((u) => u.id));
        }

        const uniqueTargets = Array.from(new Set(targets));
        if (uniqueTargets.length) {
          const message =
            input.type === SubmissionType.COMPLAINT
              ? 'someone send COMPLAINT for you'
              : 'someone send SUGGESTION for you';

          await this.prisma.notification.createMany({
            data: uniqueTargets.map((userId) => ({ userId, message, title: 'New Submission', type: 'SUBMISSION' })),
          });
        }
      } catch (err) {
        // Non-blocking: log and continue
        console.error('Failed to create submission notifications:', err);
      }
    }

    return submission;
  } catch (e: any) {
    throw new BadRequestException(e?.message || 'Failed to create submission');
  }
}


  async list(params: { type?: SubmissionType }) {
    const { type } = params;
    return this.prisma.submission.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listForRecipient(recipientUserId: string, params: { type?: SubmissionType } = {}) {
    const { type } = params;
    return this.prisma.submission.findMany({
      where: {
        recipientUserId,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        department: { select: { id: true, name: true, nameAm: true } },
      },
    });
  }

  async listForMyDepartmentUnassigned(userId: string, params: { type?: SubmissionType } = {}) {
    const me = await this.prisma.user.findUnique({ where: { id: userId }, select: { departmentId: true } });
    if (!me?.departmentId) {
      throw new BadRequestException('User is not associated with a department');
    }
    const { type } = params;
    return this.prisma.submission.findMany({
      where: {
        departmentId: me.departmentId,
        recipientUserId: null,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        department: { select: { id: true, name: true, nameAm: true } },
      },
    });
  }

  // Submissions created by the current user (non-anonymous only)
  async listCreatedBy(userId: string, params: { type?: SubmissionType } = {}) {
    const { type } = params;
    return this.prisma.submission.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { id: true, name: true, nameAm: true } },
      },
    });
  }

  // All submissions for the user's department
  async listForMyDepartment(
    userId: string,
    params: { type?: SubmissionType; includeAssigned?: boolean } = {},
  ) {
    const me = await this.prisma.user.findUnique({ where: { id: userId }, select: { departmentId: true } });
    if (!me?.departmentId) {
      throw new BadRequestException('User is not associated with a department');
    }
    const { type, includeAssigned = true } = params;
    return this.prisma.submission.findMany({
      where: {
        departmentId: me.departmentId,
        ...(includeAssigned ? {} : { recipientUserId: null }),
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        department: { select: { id: true, name: true, nameAm: true } },
      },
    });
  }

  async getById(id: string) {
    const sub = await this.prisma.submission.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('Submission not found');
    return sub;
  }

  async respondToSubmission(submissionId: string, responderUserId: string, message: string) {
    const trimmed = (message || '').trim();
    if (!trimmed) {
      throw new BadRequestException('Response message is required');
    }

    const submission = await this.prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // For now we do not persist a separate response entity; we just
    // notify the original submitter (when known and non-anonymous).
    // Build a notification message that clearly references the
    // original submission "subject" (first line of the message).
    const fullMessage: string = String(submission.message || '');
    const firstLine = fullMessage.split('\n')[0] || '';
    const subject = firstLine.length > 120 ? firstLine.slice(0, 117) + '...' : firstLine;
    const notificationMessage = subject
      ? `Response to your feedback: ${subject}\n\n${trimmed}`
      : trimmed;

    try {
      if (submission.userId && !submission.anonymous) {
        await this.prisma.notification.create({
          data: {
            userId: submission.userId,
            message: notificationMessage,
            title: 'Response to Your Feedback',
            type: 'SUBMISSION_RESPONSE',
          },
        });
      }
    } catch (err) {
      // Non-blocking: log and continue
      console.error('Failed to create submission response notification:', err);
    }

    // Return a simple payload the frontend can use to confirm success
    return { ok: true };
  }

  // GM action endpoints were removed due to simplified Submission schema
  async createWomenadnSocilaInclusion(input: CreateWomenadnSocilaInclusionInput) {
    try {
      // If no explicit victim is provided but we have a userId, treat the
      // reporting user as the victim for identified reports so that
      // victim name/phone can be displayed in the UI.
      if (!input.victimId && input.userId) {
        input.victimId = input.userId;
      }

      return await this.prisma.womenadnSocilaInclusion.create({
        data: {
          typeOfMisconduct: input.typeOfMisconduct,
          dateTime: input.dateTime,
          location: input.location ?? null,
          detailDescriptionOfIncident: input.detailDescriptionOfIncident ?? null,
          reportedBefore: input.reportedBefore,
          medicalHelpNeeded: input.medicalHelpNeeded,
          fileUrl: input.fileUrl ?? null,
          victimId: input.victimId ?? null,
          departmentId: input.departmentId ?? null,
          userId: input.userId ?? null,
        },
      });
    } catch (e: any) {
      throw new BadRequestException(e?.message || 'Failed to create record');
    }
  }

  async getWomenadnSocilaInclusion(id: string) {
    const record = await this.prisma.womenadnSocilaInclusion.findUnique({ where: { id } });
    if (!record) {
      throw new NotFoundException('Record not found');
    }
    return record;
  }

  async listWomenadnSocilaInclusion() {
    const records = await this.prisma.womenadnSocilaInclusion.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        department: {
          select: { name: true, nameAm: true },
        },
        offender: {
          select: { firstName: true, lastName: true, phone: true },
        },
        victim: {
          select: { firstName: true, lastName: true, phone: true },
        },
      },
    });

    // Project related user/department info into flat fields expected by the frontend
    return records.map((r: any) => {
      const departmentOfPerpetrator = r.department?.nameAm || r.department?.name || null;

      const perpetratorName =
        r.offender && (r.offender.firstName || r.offender.lastName)
          ? `${r.offender.firstName || ''} ${r.offender.lastName || ''}`.trim()
          : null;

      // For identified reports, victim is the applicant. If no victim
      // is linked, leave these fields null so the frontend shows '-'.
      const applicantName =
        r.victim && (r.victim.firstName || r.victim.lastName)
          ? `${r.victim.firstName || ''} ${r.victim.lastName || ''}`.trim()
          : null;

      const applicantPhone = r.victim?.phone || null;

      return {
        ...r,
        departmentOfPerpetrator,
        perpetratorName,
        applicantName,
        applicantPhone,
      };
    });
  }

  async listWomenadnSocilaInclusionForUser(userId: string) {
    const records = await this.prisma.womenadnSocilaInclusion.findMany({
      where: {
        victimId: userId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return records;
  }

  async createThirdPartySexualAssault(
    input: CreateThirdPartySexualAssaultInput,
    requesterUserId: string,
  ) {
    try {
      // Ensure referenced misconduct exists
      const misconduct = await this.prisma.womenadnSocilaInclusion.findUnique({
        where: { id: input.misconductId },
        select: { id: true },
      });
      if (!misconduct) {
        throw new BadRequestException('Referenced misconduct record not found');
      }

      return await this.prisma.thirdPartySexualAssault.create({
        data: {
          misconductId: input.misconductId,
          typeOfMisconduct: input.typeOfMisconduct,
          dateTime: input.dateTime,
          location: input.location ?? null,
          descriptionOfWhatWasObserved: input.descriptionOfWhatWasObserved ?? null,
          reqId: requesterUserId,
          victimId: input.victimUserId ?? null,
        },
      });
    } catch (e: any) {
      throw new BadRequestException(e?.message || 'Failed to create third-party sexual assault record');
    }
  }

  async listThirdPartySexualAssault() {
    return this.prisma.thirdPartySexualAssault.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        misconduct: true,
      },
    });
  }

  async getThirdPartySexualAssault(id: string) {
    const record = await this.prisma.thirdPartySexualAssault.findUnique({
      where: { id },
      include: { misconduct: true },
    });
    if (!record) {
      throw new NotFoundException('Third-party sexual assault record not found');
    }
    return record;
  }

  async listDepartments() {
    return this.prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async listUsersInMyDepartment(userId: string) {
    const me = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { departmentId: true },
    });

    if (!me?.departmentId) {
      throw new BadRequestException('User is not associated with a department');
    }

    return this.prisma.user.findMany({
      where: { departmentId: me.departmentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        roles: true,
      } as any,
      orderBy: { firstName: 'asc' },
    });
  }
}
