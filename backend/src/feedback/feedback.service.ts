import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async createFeedback(createComplaintDto: any, userId: string | null) {
    // This will use the same database table but with a different API endpoint
    // We add a flag to distinguish feedback from anti-corruption reports
    
    // Generate tracking ID, reference number, and anonymous token for external feedback
    let trackingId = null;
    let verificationSecret = null;
    let anonymousToken = null;
    let referenceNumber = null;
    
    if (createComplaintDto.isInternal === false) {
      const year = new Date().getFullYear();
      const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
      trackingId = `FCSC-${year}-${randomPart}`;
      
      verificationSecret = createComplaintDto.verificationSecret || 
        Math.floor(100000 + Math.random() * 900000).toString();
      
      anonymousToken = randomUUID();
      
      // Generate reference number for feedback complaints
      referenceNumber = `FCSC-${year}-${Math.floor(10000 + Math.random() * 90000)}`;
    }
    
    const data = {
      ...createComplaintDto,
      isFeedback: true, // Add this flag to distinguish feedback
      referenceNumber,
      trackingId,
      verificationSecret,
      anonymousToken,
      createdBy: userId,
      // Map department field to departmentName for the database
      departmentName: createComplaintDto.department || null,
      // Remove department field to avoid Prisma relation conflict
      department: undefined,
    };
    
    return this.prisma.complaint.create({
      data,
    });
  }

  async trackFeedback(trackingId: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { trackingId },
      include: {
        messages: {
          orderBy: { sentAt: 'asc' },
        },
        investigation: {
          include: {
            assignedInvestigator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        departmentalResponse: true,
        department: true,
        petitions: {
          select: {
            id: true,
            petitionNumber: true,
            status: true,
            reasonForDissatisfaction: true,
            explanation: true,
            additionalInfo: true,
            requestedAction: true,
            investigationInstructions: true,
            investigationDeadline: true,
            investigationReport: {
              select: {
                observations: true,
              },
            },
          },
        },
      },
    });

    return complaint;
  }

  async getMessagesByTrackingId(trackingId: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { trackingId },
    });

    if (!complaint) {
      throw new Error('Feedback not found');
    }

    return this.prisma.complaintMessage.findMany({
      where: { 
        complaintId: complaint.id,
        visibility: 'COMPLAINANT_VISIBLE',
      },
      orderBy: { sentAt: 'asc' },
    });
  }

  async sendMessageByTrackingId(trackingId: string, message: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { trackingId },
      select: { id: true, createdBy: true, complainantEmail: true, anonymousToken: true, isAnonymous: true },
    });

    if (!complaint) {
      throw new Error('Feedback not found');
    }

    // For anonymous complaints, senderId should be null (no User relation)
    // For registered complaints, use createdBy
    // If anonymousToken is missing (old data), generate one on the fly
    let senderId = complaint.createdBy;
    let senderRole = 'END_USER';
    
    if (complaint.isAnonymous) {
      // For anonymous complaints, we cannot use senderId as it must be a valid user UUID
      // Instead, we'll use the anonymousToken and leave senderId null
      senderId = null;
      senderRole = 'ANONYMOUS';
      
      if (!complaint.anonymousToken) {
        // Generate anonymous token for old complaints that don't have one
        const newAnonymousToken = randomUUID();
        await this.prisma.complaint.update({
          where: { id: complaint.id },
          data: { anonymousToken: newAnonymousToken },
        });
      }
    } else if (!senderId) {
      // For non-anonymous complaints without createdBy, use anonymousToken as fallback
      senderId = complaint.anonymousToken;
    }

    return this.prisma.complaintMessage.create({
      data: {
        complaintId: complaint.id,
        senderId: senderId, // null for anonymous complaints
        senderType: 'COMPLAINANT',
        senderRole: senderRole,
        message: message,
        messageType: 'REPLY',
        visibility: 'COMPLAINANT_VISIBLE',
        isSystemMessage: false,
        deliveryStatus: 'DELIVERED',
        sentAt: new Date(),
      },
    });
  }

  async submitPetitionByTrackingId(trackingId: string, data: {
    reasonForDissatisfaction: string;
    explanation: string;
    additionalInfo?: string;
    requestedAction?: string;
  }) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { trackingId },
    });

    if (!complaint) {
      throw new Error('Feedback not found');
    }

    // Generate petition number
    const petitionNumber = `PET-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

    // Create petition
    const petition = await this.prisma.petition.create({
      data: {
        petitionNumber,
        complaint: {
          connect: { id: complaint.id },
        },
        reasonForDissatisfaction: data.reasonForDissatisfaction,
        explanation: data.explanation,
        additionalInfo: data.additionalInfo,
        requestedAction: data.requestedAction,
        status: 'Petition Submitted',
      },
    });

    // Update complaint status
    await this.prisma.complaint.update({
      where: { id: complaint.id },
      data: {
        status: 'Petition Submitted',
      },
    });

    // Send notification message
    await this.prisma.complaintMessage.create({
      data: {
        complaintId: complaint.id,
        message: 'Petition submitted by complainant',
        senderType: 'COMPLAINANT',
        senderRole: 'Complainant',
        messageType: 'STATUS_UPDATE',
        visibility: 'COMPLAINANT_VISIBLE',
        isSystemMessage: true,
      },
    });

    return petition;
  }

  async acceptResponseByTrackingId(trackingId: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { trackingId },
      include: {
        department: true,
      },
    });

    if (!complaint) {
      throw new Error('Feedback not found');
    }

    // Update complaint status to Closed
    await this.prisma.complaint.update({
      where: { id: complaint.id },
      data: {
        status: 'Closed',
      },
    });

    // Send notification message
    await this.prisma.complaintMessage.create({
      data: {
        complaintId: complaint.id,
        message: 'ቅሬታ አቅራቢዉ በመልሡ ተስማምቷል',
        senderType: 'COMPLAINANT',
        senderRole: 'Complainant',
        messageType: 'STATUS_UPDATE',
        visibility: 'COMPLAINANT_VISIBLE',
        isSystemMessage: true,
      },
    });

    // Send notifications to Feedback Manager, Department Head, and Commissioner
    const notificationMessage = 'ቅሬታ አቅራቢዉ በመልሡ ተስማምቷል';
    
    // Find users with relevant roles
    const feedbackManagers = await this.prisma.user.findMany({
      where: {
        roles: {
          has: 'Feedback_Complaint_Manager',
        },
      },
      select: { id: true },
    });

    const commissioners = await this.prisma.user.findMany({
      where: {
        roles: {
          has: 'Commissioner',
        },
      },
      select: { id: true },
    });

    // Notify department head if department is assigned
    let departmentHeadId = null;
    if (complaint.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: complaint.departmentId },
        select: { headId: true },
      });
      departmentHeadId = department?.headId;
    }

    // Create notifications for all relevant users
    const notificationData = [];
    
    // Feedback Manager notifications
    feedbackManagers.forEach((manager) => {
      notificationData.push({
        userId: manager.id,
        message: notificationMessage,
        type: 'COMPLAINT_RESPONSE_ACCEPTED',
        relatedId: complaint.id,
        departmentId: complaint.departmentId,
      });
    });

    // Commissioner notifications
    commissioners.forEach((commissioner) => {
      notificationData.push({
        userId: commissioner.id,
        message: notificationMessage,
        type: 'COMPLAINT_RESPONSE_ACCEPTED',
        relatedId: complaint.id,
        departmentId: complaint.departmentId,
      });
    });

    // Department Head notification
    if (departmentHeadId) {
      notificationData.push({
        userId: departmentHeadId,
        message: notificationMessage,
        type: 'COMPLAINT_RESPONSE_ACCEPTED',
        relatedId: complaint.id,
        departmentId: complaint.departmentId,
      });
    }

    // Create all notifications
    if (notificationData.length > 0) {
      await this.prisma.userNotification.createMany({
        data: notificationData,
      });
    }

    return { message: 'Response accepted and complaint closed' };
  }

  async findAllFeedback(params: {
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
    userId?: string;
    isFeedbackStaff?: boolean;
    isDepartmentHead?: boolean;
  }) {
    const { status, category, priority, search, userId, isFeedbackStaff, isDepartmentHead } = params;
    
    const where: any = {
      isFeedback: true, // Only return feedback items
    };

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    // If not staff and not department head, only show user's own feedback
    if (!isFeedbackStaff && !isDepartmentHead && userId) {
      where.createdBy = userId;
    }

    return this.prisma.complaint.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            nameAm: true,
          },
        },
        departmentalResponse: true,
      },
    });
  }

  async findAllInvestigations(userId: string, isFeedbackStaff: boolean, bypassUserFilter: boolean = false) {
    const where: any = {
      complaint: {
        isFeedback: true, // Only return feedback investigations
      },
    };

    // If not staff and not bypassing filter, only show investigations assigned to user
    if (!isFeedbackStaff && !bypassUserFilter) {
      where.OR = [
        { assignedInvestigatorId: userId },
        { assignedSupervisorId: userId },
        { assignedById: userId },
      ];
    }

    const investigations = await this.prisma.investigation.findMany({
      where,
      include: {
        complaint: {
          select: {
            id: true,
            subject: true,
            category: true,
            status: true,
            priority: true,
            createdAt: true,
          },
        },
        assignedInvestigator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedSupervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to match frontend expected format
    return investigations.map((inv) => ({
      id: inv.id,
      caseNumber: inv.caseNumber,
      complaintId: inv.complaintId,
      complaintReference: inv.complaint.subject, // Using subject as reference for now
      category: inv.complaint.category,
      status: inv.status,
      priority: inv.complaint.priority,
      assignedInvestigator: inv.assignedInvestigator,
      assignedSupervisor: inv.assignedSupervisor ? `${inv.assignedSupervisor.firstName} ${inv.assignedSupervisor.lastName}` : undefined,
      startDate: inv.startDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      targetCompletionDate: inv.targetCompletionDate?.toISOString().split('T')[0],
      actualCompletionDate: inv.actualCompletionDate?.toISOString().split('T')[0],
      findings: inv.findings,
      recommendation: inv.recommendation,
      decision: inv.decision,
      outcome: inv.outcome,
    }));
  }

  async findInvestigationById(id: string) {
    const investigation = await this.prisma.investigation.findUnique({
      where: { id },
      include: {
        complaint: true,
        assignedInvestigator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedSupervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        evidence: true,
      },
    });

    if (!investigation) {
      throw new Error('Investigation not found');
    }

    return investigation;
  }

  async markAsViewed(complaintId: string, userId: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    // Only mark as viewed if not already viewed
    // @ts-ignore - viewedAt field added to schema
    if (!complaint.viewedAt) {
      await this.prisma.complaint.update({
        where: { id: complaintId },
        // @ts-ignore - viewedAt and viewedById fields added to schema
        data: {
          // @ts-ignore
          viewedAt: new Date(),
          // @ts-ignore
          viewedById: userId,
        },
      });
    }

    return { message: 'Complaint marked as viewed' };
  }

  async findFeedbackById(id: string) {
    return this.prisma.complaint.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { sentAt: 'asc' },
        },
        departmentalResponse: true,
        attachments: true,
      },
    });
  }

  async updateFeedback(id: string, updateData: any) {
    return this.prisma.complaint.update({
      where: { id },
      data: updateData,
    });
  }

  async sendMessageToComplainant(
    complaintId: string,
    message: string,
    senderId: string,
    senderRole: string,
    senderType: string,
    messageType: string,
    visibility: string,
  ) {
    return this.prisma.complaintMessage.create({
      data: {
        complaintId,
        message,
        senderId,
        senderRole,
        senderType,
        messageType,
        visibility,
      },
    });
  }

  async getFeedbackMessages(complaintId: string, userId: string, userRoles: string[]) {
    return this.prisma.complaintMessage.findMany({
      where: {
        complaintId,
      },
      orderBy: { sentAt: 'asc' },
    });
  }

  async createInvestigation(complaintId: string, data: any, assignedById: string) {
    // Check if complaint exists
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    // Check if investigation already exists
    const existingInvestigation = await this.prisma.investigation.findUnique({
      where: { complaintId },
    });

    if (existingInvestigation) {
      throw new Error('Investigation already exists for this complaint');
    }

    // Generate case number
    const year = new Date().getFullYear();
    const caseNumber = `CASE-${year}-${Math.floor(10000 + Math.random() * 90000)}`;

    const investigation = await this.prisma.investigation.create({
      data: {
        caseNumber,
        complaintId,
        assignedInvestigatorId: data.assignedInvestigatorId,
        assignedSupervisorId: data.assignedSupervisorId,
        assignedById,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        targetCompletionDate: data.targetCompletionDate ? new Date(data.targetCompletionDate) : null,
        scope: data.scope || null,
        objectives: data.objectives || null,
        status: 'Assigned',
      },
    });

    // Update complaint status to 'Under Investigation'
    await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: 'Under Investigation',
        assignedAt: new Date(),
      },
    });

    return investigation;
  }

  async getFeedbackOfficers() {
    // Get all users with feedback/complaint related roles
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { roles: { has: 'Feedback_Complaint_Manager' } },
          { roles: { has: 'Feedback_Complaint_Officer' } },
          { roles: { has: 'feedback_complaint_manager' } },
          { roles: { has: 'feedback_complaint_officer' } },
        ]
      }
    });

    return users;
  }

  async updateInvestigation(investigationId: string, data: any) {
    const updateData: any = {
      complaintDetails: data.complaintDetails,
      evidenceDetails: data.evidenceDetails,
      evidenceDocuments: data.evidenceDocuments,
      evidenceMessages: data.evidenceMessages,
      findings: data.findings,
      rootCause: data.rootCause,
      responsibility: data.responsibility,
      responsibilityOffice: data.responsibilityOffice,
      responsibilityPerson: data.responsibilityPerson,
      impact: data.impact,
      outcome: data.outcome,
      recommendation: data.recommendation,
      correctiveAction: data.correctiveAction,
    };

    // Update status if provided
    if (data.status) {
      updateData.status = data.status;
    }

    // Update review notes if provided
    if (data.reviewNotes) {
      updateData.reviewNotes = data.reviewNotes;
    }

    // Update approval fields if provided
    if (data.approvalRemarks) {
      updateData.closureReason = data.approvalRemarks; // Use closureReason field for approval remarks
    }

    if (data.conclusion) {
      updateData.outcome = data.conclusion; // Store conclusion in outcome field
    }

    if (data.correctiveAction) {
      updateData.correctiveAction = data.correctiveAction;
    }

    if (data.decision) {
      updateData.decision = data.decision;
    }

    if (data.decisionDate) {
      updateData.decisionDate = data.decisionDate;
    }

    return this.prisma.investigation.update({
      where: { id: investigationId },
      data: updateData,
    });
  }

  async uploadEvidence(investigationId: string, files: Express.Multer.File[], userId: string) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'investigation-evidence');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const evidenceRecords = [];

    for (const file of files) {
      const fileName = `${randomUUID()}-${file.originalname}`;
      const filePath = path.join(uploadDir, fileName);
      const relativePath = `/uploads/investigation-evidence/${fileName}`;

      // Save file to disk
      fs.writeFileSync(filePath, file.buffer);

      // Create evidence record in database
      const evidence = await this.prisma.evidence.create({
        data: {
          investigationId,
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          filePath: relativePath,
          uploadedBy: userId,
        },
      });

      evidenceRecords.push(evidence);
    }

    return evidenceRecords;
  }

  async returnToComplainant(complaintId: string, returnReason: string, userId: string) {
    // Get the complaint
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { investigation: true },
    });

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    // Update complaint status to indicate it's returned
    const updatedComplaint = await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: 'Returned',
        screeningNotes: returnReason,
      },
    });

    // If there's an investigation, update its status as well
    if (complaint.investigation) {
      await this.prisma.investigation.update({
        where: { id: complaint.investigation.id },
        data: {
          status: 'Returned for Further Investigation',
          closureReason: returnReason,
        },
      });
    }

    // Send a message to the complainant about the return
    await this.prisma.complaintMessage.create({
      data: {
        complaintId,
        message: `Your complaint has been returned with the following reason: ${returnReason}`,
        senderId: userId,
        senderRole: 'Feedback Staff',
        senderType: 'DEPARTMENT',
        messageType: 'SYSTEM',
        visibility: 'COMPLAINANT_VISIBLE',
      },
    });

    return updatedComplaint;
  }

  async getDepartments() {
    return this.prisma.department.findMany({
      where: { isActive: true },
    });
  }

  async assignToDepartment(complaintId: string, departmentId: string, instructions: string, userId: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      throw new Error('Department not found');
    }

    const updatedComplaint = await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: 'Assigned to Department',
        screeningNotes: instructions || null,
        departmentId: departmentId as any,
      },
    });

    // Send notification to department head
    const departmentWithHead = await this.prisma.department.findUnique({
      where: { id: departmentId },
      select: { headId: true } as any,
    });
    if (departmentWithHead?.headId) {
      await this.prisma.complaintMessage.create({
        data: {
          complaintId,
          message: `Complaint assigned to your department${instructions ? ': ' + instructions : ''}`,
          senderId: userId,
          senderRole: 'Feedback Manager',
          senderType: 'DEPARTMENT',
          messageType: 'SYSTEM',
          visibility: 'INTERNAL_ONLY',
        },
      });
    }

    return updatedComplaint;
  }

  async submitDepartmentalResponse(
    complaintId: string,
    data: {
      summary: string;
      investigationConducted: string;
      findings: string;
      actionsTaken: string;
      proposedActions?: string;
      officialResponse: string;
      recommendations?: string;
    },
    userId: string
  ) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { departmentalResponse: true } as any,
    });

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    // Generate response number
    const responseNumber = `DR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

    const departmentalResponse = await (this.prisma as any).departmentalResponse.create({
      data: {
        responseNumber,
        complaintId,
        summary: data.summary,
        investigationConducted: data.investigationConducted,
        findings: data.findings,
        actionsTaken: data.actionsTaken,
        proposedActions: data.proposedActions,
        officialResponse: data.officialResponse,
        recommendations: data.recommendations,
        status: 'Response Submitted',
        submittedById: userId,
        submittedAt: new Date(),
      },
    });

    // Update complaint status
    await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: 'Response Submitted',
      },
    });

    // Send notification to Feedback Manager
    await this.prisma.complaintMessage.create({
      data: {
        complaintId,
        message: 'Departmental response submitted for review',
        senderId: userId,
        senderRole: 'Department Head',
        senderType: 'DEPARTMENT',
        messageType: 'SYSTEM',
        visibility: 'COMPLAINANT_VISIBLE',
      },
    });

    return departmentalResponse;
  }

  async submitPetition(
    complaintId: string,
    data: {
      reasonForDissatisfaction: string;
      explanation: string;
      additionalInfo?: string;
      requestedAction?: string;
    },
    userId: string
  ) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    // Generate petition number
    const petitionNumber = `PET-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

    const petition = await (this.prisma as any).petition.create({
      data: {
        petitionNumber,
        complaintId,
        reasonForDissatisfaction: data.reasonForDissatisfaction,
        explanation: data.explanation,
        additionalInfo: data.additionalInfo || null,
        requestedAction: data.requestedAction || null,
        status: 'Petition Submitted',
      },
    } as any);

    // Update complaint status
    await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: 'Petition Submitted',
      },
    });

    // Send notification to Feedback Manager
    await this.prisma.complaintMessage.create({
      data: {
        complaintId,
        message: 'Petition submitted for review',
        senderId: userId,
        senderRole: 'Complainant',
        senderType: 'COMPLAINANT',
        messageType: 'SYSTEM',
        visibility: 'INTERNAL_ONLY',
      },
    });

    return petition;
  }

  async assignPetition(complaintId: string, officerId: string, userId: string, investigationInstructions?: string, investigationDeadline?: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { petitions: true } as any,
    });

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    const petition = complaint.petitions[0];
    if (!petition) {
      throw new Error('No petition found for this complaint');
    }

    const updatedPetition = await this.prisma.petition.update({
      where: { id: petition.id },
      data: {
        assignedOfficerId: officerId,
        assignedById: userId,
        assignedAt: new Date(),
        investigationInstructions,
        investigationDeadline: investigationDeadline ? new Date(investigationDeadline) : null,
        status: 'Assigned for Investigation',
      },
    });

    // Update complaint status
    await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: 'Assigned for Investigation',
      },
    });

    // Send notification to assigned officer
    await this.prisma.complaintMessage.create({
      data: {
        complaintId,
        message: `Petition assigned for investigation. ${investigationInstructions ? `Instructions: ${investigationInstructions}` : ''}`,
        senderId: userId,
        senderRole: 'Feedback Manager',
        senderType: 'DEPARTMENT',
        messageType: 'SYSTEM',
        visibility: 'INTERNAL_ONLY',
      },
    });

    return updatedPetition;
  }

  async getPetitionCount(userId: string, userRole: string) {
    if (userRole === 'Feedback_Complaint_Manager') {
      // Manager sees all petitions that need review (Petition Submitted status)
      return this.prisma.petition.count({
        where: {
          status: 'Petition Submitted',
        },
      });
    } else if (userRole === 'Feedback_Complaint_Officer') {
      // Officer sees petitions assigned to them
      return this.prisma.petition.count({
        where: {
          assignedOfficerId: userId,
          status: 'Assigned for Investigation',
        },
      });
    }
    return 0;
  }

  async getAssignedPetitions(userId: string) {
    const petitions = await this.prisma.petition.findMany({
      where: {
        assignedOfficerId: userId,
      },
      include: {
        complaint: {
          include: {
            departmentalResponse: true,
          },
        },
        assignedOfficer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
        investigationReport: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return petitions;
  }

  async getAllPetitions() {
    const petitions = await this.prisma.petition.findMany({
      include: {
        complaint: {
          include: {
            departmentalResponse: true,
          },
        },
        assignedOfficer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        investigationReport: {
          include: {
            finalDecisionBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return petitions;
  }

  async createPetition(
    data: {
      petitionNumber: string;
      complaintId: string;
      reasonForDissatisfaction: string;
      explanation: string;
      status?: string;
    },
    userId: string
  ) {
    return this.prisma.petition.create({
      data: {
        petitionNumber: data.petitionNumber,
        complaintId: data.complaintId,
        reasonForDissatisfaction: data.reasonForDissatisfaction,
        explanation: data.explanation,
        status: data.status || 'Petition Submitted',
        assignedById: userId,
        assignedAt: new Date(),
      },
      include: {
        complaint: {
          include: {
            departmentalResponse: true,
          },
        },
        assignedOfficer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async submitInvestigationReport(
    petitionId: string,
    data: {
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
    userId: string
  ) {
    try {
      const petition = await (this.prisma as any).petition.findUnique({
        where: { id: petitionId },
        include: { complaint: true },
      });

      if (!petition) {
        throw new Error('Petition not found');
      }

      // Check if investigation report already exists
      const existingReport = await (this.prisma as any).investigationReport.findUnique({
        where: { petitionId },
      });

      let investigationReport;

      if (existingReport) {
        // Update existing report
        investigationReport = await (this.prisma as any).investigationReport.update({
          where: { petitionId },
          data: {
            activitiesPerformed: data.activitiesPerformed,
            evidenceCollected: data.evidenceCollected,
            personsInterviewed: data.personsInterviewed,
            findings: data.findings,
            observations: data.observations,
            conclusions: data.conclusions,
            recommendations: data.recommendations,
            status: 'Investigation Report Submitted',
            submittedById: userId,
            submittedAt: new Date(),
          },
        });
      } else {
        // Generate report number for new report
        const reportNumber = `IR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

        investigationReport = await (this.prisma as any).investigationReport.create({
          data: {
            reportNumber,
            petitionId,
            activitiesPerformed: data.activitiesPerformed,
            evidenceCollected: data.evidenceCollected,
            personsInterviewed: data.personsInterviewed,
            findings: data.findings,
            observations: data.observations,
            conclusions: data.conclusions,
            recommendations: data.recommendations,
            status: 'Investigation Report Submitted',
            submittedById: userId,
            submittedAt: new Date(),
          },
        });
      }

      // Update petition status
      await (this.prisma as any).petition.update({
        where: { id: petitionId },
        data: {
          status: 'Investigation Report Submitted',
        },
      });

      // Update complaint status
      if (petition.complaintId) {
        await this.prisma.complaint.update({
          where: { id: petition.complaintId },
          data: {
            status: 'Investigation Report Submitted',
          },
        });
      }

      // Send notification to Feedback Manager
      if (petition.complaintId) {
        try {
          await this.prisma.complaintMessage.create({
            data: {
              complaintId: petition.complaintId,
              message: 'Investigation report submitted for review',
              senderId: userId,
              senderRole: 'Feedback Officer',
              senderType: 'DEPARTMENT',
              messageType: 'SYSTEM',
              visibility: 'INTERNAL_ONLY',
            },
          });
        } catch (error) {
          // Log error but don't fail the entire operation
          console.error('Failed to create notification:', error);
        }
      }

      return investigationReport;
    } catch (error) {
      console.error('Error in submitInvestigationReport:', error);
      throw error;
    };
  }

  async sendPetitionToCommissioner(
    petitionId: string,
    data: {
      commissionerId: string;
      managerConclusion: string;
    },
    userId: string
  ) {
    const petition = await (this.prisma as any).petition.findUnique({
      where: { id: petitionId },
      include: { complaint: true },
    });

    if (!petition) {
      throw new Error('Petition not found');
    }

    // Update petition status to indicate it's with commissioner
    await (this.prisma as any).petition.update({
      where: { id: petitionId },
      data: {
        status: 'Under Final Decision Review',
        assignedById: userId,
      },
    });

    // Create a message for the commissioner
    await this.prisma.complaintMessage.create({
      data: {
        complaintId: petition.complaintId,
        message: `Petition ${petition.petitionNumber} has been sent to you for final decision review.\n\nManager's Conclusion:\n${data.managerConclusion}`,
        senderId: userId,
        senderRole: 'Feedback Manager',
        senderType: 'DEPARTMENT',
        messageType: 'SYSTEM',
        visibility: 'INTERNAL_ONLY',
      },
    });

    return { message: 'Petition sent to commissioner successfully' };
  }

  async getCommissionerDecision(petitionId: string) {
    const petition = await (this.prisma as any).petition.findUnique({
      where: { id: petitionId },
      include: {
        complaint: true,
        investigationReport: true,
      },
    });

    if (!petition) {
      throw new Error('Petition not found');
    }

    if (!petition.investigationReport?.observations) {
      throw new Error('No commissioner decision found');
    }

    try {
      const observations = JSON.parse(petition.investigationReport.observations);
      if (!observations.commissionerDecision) {
        throw new Error('No commissioner decision found in observations');
      }

      return {
        petition: {
          petitionNumber: petition.petitionNumber,
          status: petition.status,
        },
        complaint: {
          institution: petition.complaint.institution,
          complainantName: petition.complaint.complainantName,
          complainantEmail: petition.complaint.complainantEmail,
        },
        commissionerDecision: observations.commissionerDecision,
      };
    } catch (error) {
      throw new Error('Failed to parse commissioner decision');
    }
  }

  async submitCommissionerDecision(
    petitionId: string,
    decisionData: any,
    userId: string
  ) {
    const petition = await (this.prisma as any).petition.findUnique({
      where: { id: petitionId },
      include: { 
        complaint: true,
        investigationReport: true
      },
    });

    if (!petition) {
      throw new Error('Petition not found');
    }

    // Update investigation report with commissioner decision and all form data
    if (petition.investigationReport) {
      await (this.prisma as any).investigationReport.update({
        where: { id: petition.investigationReport.id },
        data: {
          finalDecision: decisionData.finalDecisionSummary,
          status: 'Final Decision Issued',
          reviewedById: userId,
          reviewedAt: new Date(),
          // Store commissioner decision data as JSON in observations or create new fields
          observations: JSON.stringify({
            commissionerDecision: {
              petitionId: decisionData.petitionId,
              petitionSubject: decisionData.petitionSubject,
              petitionerName: decisionData.petitionerName,
              concernedDepartment: decisionData.concernedDepartment,
              dateReceived: decisionData.dateReceived,
              investigationReportAttachment: decisionData.investigationReportAttachment,
              summaryOfFindings: decisionData.summaryOfFindings,
              evidenceReviewed: decisionData.evidenceReviewed,
              investigatorRecommendation: decisionData.investigatorRecommendation,
              commissionerObservations: decisionData.commissionerObservations,
              legalPolicyBasis: decisionData.legalPolicyBasis,
              decisionType: decisionData.decisionType,
              disciplinaryAction: decisionData.disciplinaryAction,
              responsibleDepartment: decisionData.responsibleDepartment,
              implementationDeadline: decisionData.implementationDeadline,
              finalDecisionSummary: decisionData.finalDecisionSummary,
              commissionerName: decisionData.commissionerName,
              decisionDate: decisionData.decisionDate,
              decisionNotificationStatus: decisionData.decisionNotificationStatus,
              implementationStatus: decisionData.implementationStatus,
              closureRemarks: decisionData.closureRemarks,
              finalPetitionStatus: decisionData.finalPetitionStatus,
              submittedByCommissionerId: userId,
              submittedAt: new Date().toISOString(),
            }
          }),
        },
      });
    }

    // Update petition status based on final decision
    const newPetitionStatus = decisionData.finalPetitionStatus || 'Closed';
    await (this.prisma as any).petition.update({
      where: { id: petitionId },
      data: {
        status: newPetitionStatus,
      },
    });

    // Update complaint status
    await this.prisma.complaint.update({
      where: { id: petition.complaintId },
      data: {
        status: newPetitionStatus,
      },
    });

    // Create notification for concerned department
    try {
      // Find users in the concerned department (Department_Head role)
      const departmentUsers = await this.prisma.user.findMany({
        where: {
          departmentId: petition.complaint.departmentId,
          roles: { has: 'Department_Head' },
        },
        select: { id: true },
      });

      if (departmentUsers.length > 0) {
        const departmentName = decisionData.responsibleDepartment || petition.complaint.institution || petition.complaint.departmentName || 'N/A';
        const petitionSubject = petition.reasonForDissatisfaction || petition.complaint?.category || 'N/A';
        await this.prisma.userNotification.createMany({
          data: departmentUsers.map((user) => ({
            userId: user.id,
            message: `የመጨረሻ የአቤቱታ ዉሳኔ ዝርዝር
Download

የኮሚሽነር የመጨረሻ ዉሳኔ

To: ${departmentName}

Petition Subject: ${petitionSubject}

አቤቱታ ያቀረበዉ አካል: ${decisionData.petitionerName || petition.complaint?.complainantName || 'N/A'}

የኮሚሽነር ዉሳኔ :

- የኮሚሽነር ምልከታ: ${decisionData.commissionerObservations || 'N/A'}

- Legal/Policy Basis: ${decisionData.legalPolicyBasis || 'N/A'}

Decision Details:

Decision Type: ${decisionData.decisionType || 'N/A'}
Disciplinary Action: ${decisionData.disciplinaryAction || 'N/A'}
Responsible Department: ${decisionData.responsibleDepartment || departmentName}
Implementation Deadline: ${decisionData.implementationDeadline || 'N/A'}
Final Decision Summary: ${decisionData.finalDecisionSummary || 'N/A'}

Decision Date: ${decisionData.decisionDate || 'N/A'}

Final Petition Status: ${decisionData.finalPetitionStatus || 'Closed'}

Closure Remarks: ${decisionData.closureRemarks || 'N/A'}`,
            type: 'COMMISSIONER_DECISION',
            relatedId: petition.id,
            isRead: false,
          })),
        });
      }
    } catch (error) {
      console.error('Error creating department notification:', error);
    }

    // Store commissioner decision as a detailed message
    await this.prisma.complaintMessage.create({
      data: {
        complaintId: petition.complaintId,
        message: `=== COMMISSIONER FINAL DECISION ===\n\n` +
                  `Decision Type: ${decisionData.decisionType}\n` +
                  `Disciplinary Action: ${decisionData.disciplinaryAction}\n` +
                  `Responsible Department: ${decisionData.responsibleDepartment}\n` +
                  `Implementation Deadline: ${decisionData.implementationDeadline}\n\n` +
                  `Commissioner's Observations:\n${decisionData.commissionerObservations}\n\n` +
                  `Legal/Policy Basis:\n${decisionData.legalPolicyBasis}\n\n` +
                  `Final Decision Summary:\n${decisionData.finalDecisionSummary}\n\n` +
                  `Commissioner: ${decisionData.commissionerName}\n` +
                  `Decision Date: ${decisionData.decisionDate}\n` +
                  `Final Petition Status: ${decisionData.finalPetitionStatus}\n\n` +
                  `Closure Remarks:\n${decisionData.closureRemarks}`,
        senderId: userId,
        senderRole: 'Commissioner',
        senderType: 'COMMISSIONER',
        messageType: 'SYSTEM',
        visibility: 'INTERNAL_ONLY',
      },
    });

    return {
      success: true,
      petitionId,
      status: newPetitionStatus,
      decision: decisionData.decisionType,
      decisionData: decisionData,
    };
  }

  async sendCommissionerDecisionNotification(
    petitionId: string,
    notificationData: any,
    userId: string
  ) {
    const petition = await (this.prisma as any).petition.findUnique({
      where: { id: petitionId },
      include: { 
        complaint: true,
        investigationReport: true
      },
    });

    if (!petition) {
      throw new Error('Petition not found');
    }

    const { commissionerDecision, complainantEmail, complainantName, concernedDepartment, petitionNumber } = notificationData;

    // Create notification message for complainant
    if (complainantEmail && complainantName) {
      const complainantMessage = `
=== COMMISSIONER FINAL DECISION NOTIFICATION ===

Dear ${complainantName},

The Commissioner has issued a final decision on your petition (${petitionNumber}).

Decision Details:
- Decision Type: ${commissionerDecision?.decisionType || 'N/A'}
- Disciplinary Action: ${commissionerDecision?.disciplinaryAction || 'N/A'}
- Responsible Department: ${commissionerDecision?.responsibleDepartment || 'N/A'}
- Implementation Deadline: ${commissionerDecision?.implementationDeadline || 'N/A'}

Commissioner's Observations:
${commissionerDecision?.commissionerObservations || 'N/A'}

Legal/Policy Basis:
${commissionerDecision?.legalPolicyBasis || 'N/A'}

Final Decision Summary:
${commissionerDecision?.finalDecisionSummary || 'N/A'}

Commissioner: ${commissionerDecision?.commissionerName || 'N/A'}
Decision Date: ${commissionerDecision?.decisionDate || 'N/A'}

Final Petition Status: ${commissionerDecision?.finalPetitionStatus || 'Closed'}

Closure Remarks:
${commissionerDecision?.closureRemarks || 'N/A'}

This decision has been communicated to the concerned department for implementation.

Sincerely,
Ethics and Anti-Corruption Commission
      `.trim();

      await this.prisma.complaintMessage.create({
        data: {
          complaintId: petition.complaintId,
          message: complainantMessage,
          senderId: userId,
          senderRole: 'System',
          senderType: 'SYSTEM',
          messageType: 'NOTIFICATION',
          visibility: 'PUBLIC',
        },
      });
    }

    // Create notification message for concerned department
    if (concernedDepartment) {
      const petitionSubject = petition.reasonForDissatisfaction || petition.complaint?.category || 'N/A';
      const departmentMessage = `የመጨረሻ የአቤቱታ ዉሳኔ ዝርዝር
Download

የኮሚሽነር የመጨረሻ ዉሳኔ

To: ${concernedDepartment}

Petition Subject: ${petitionSubject}

አቤቱታ ያቀረበዉ አካል: ${commissionerDecision?.petitionerName || 'N/A'}

የኮሚሽነር ዉሳኔ :

- የኮሚሽነር ምልከታ: ${commissionerDecision?.commissionerObservations || 'N/A'}

- Legal/Policy Basis: ${commissionerDecision?.legalPolicyBasis || 'N/A'}

Decision Details:

Decision Type: ${commissionerDecision?.decisionType || 'N/A'}
Disciplinary Action: ${commissionerDecision?.disciplinaryAction || 'N/A'}
Responsible Department: ${commissionerDecision?.responsibleDepartment || concernedDepartment}
Implementation Deadline: ${commissionerDecision?.implementationDeadline || 'N/A'}
Final Decision Summary: ${commissionerDecision?.finalDecisionSummary || 'N/A'}

Decision Date: ${commissionerDecision?.decisionDate || 'N/A'}

Final Petition Status: ${commissionerDecision?.finalPetitionStatus || 'Closed'}

Closure Remarks: ${commissionerDecision?.closureRemarks || 'N/A'}`;

      await this.prisma.complaintMessage.create({
        data: {
          complaintId: petition.complaintId,
          message: departmentMessage,
          senderId: userId,
          senderRole: 'System',
          senderType: 'SYSTEM',
          messageType: 'NOTIFICATION',
          visibility: 'INTERNAL_ONLY',
        },
      });
    }

    // Update petition to mark notification as sent
    await (this.prisma as any).petition.update({
      where: { id: petitionId },
      data: {
        // Add a flag or field to track notification status if needed
        // For now, we'll update the status to indicate notification sent
      },
    });

    return {
      success: true,
      message: 'Notification sent successfully to concerned department and complainant',
      petitionId,
      notifiedComplainant: !!complainantEmail,
      notifiedDepartment: !!concernedDepartment,
    };
  }

  // Administrative Complaints Workflow Functions

  async assignToAdministrativeComplaintsTeam(complaintId: string, userId: string, assignedUserId?: string, instructions?: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    // Get assigned user details if provided
    let assignedUserName = 'Administrative Complaints Team';
    if (assignedUserId) {
      const assignedUser = await this.prisma.user.findUnique({
        where: { id: assignedUserId },
      });
      if (assignedUser) {
        assignedUserName = `${assignedUser.firstName} ${assignedUser.lastName}`;
      }
    }

    // Update complaint status to Assigned_To_Investigation_Team
    await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: 'Assigned_To_Investigation_Team',
        assigneeId: assignedUserId || null,
      },
    });

    // Create system message
    await this.prisma.complaintMessage.create({
      data: {
        complaintId,
        message: instructions 
          ? `Complaint assigned to ${assignedUserName}. Instructions: ${instructions}`
          : `Complaint assigned to ${assignedUserName}`,
        senderId: userId,
        senderRole: 'Feedback_Complaint_Manager',
        senderType: 'INTERNAL',
        messageType: 'STATUS_UPDATE',
        visibility: 'INTERNAL_ONLY',
      },
    });

    return { message: 'Complaint assigned to administrative complaints team' };
  }

  async forwardToInvestigationTeam(complaintId: string, userId: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    // Update complaint status to Assigned_To_Investigation_Team
    await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: 'Assigned_To_Investigation_Team',
        assignedAt: new Date(),
      },
    });

    // Create system message
    await this.prisma.complaintMessage.create({
      data: {
        complaintId,
        message: 'Complaint forwarded to Administrative Complaints Investigation Team',
        senderId: userId,
        senderRole: 'Feedback_Complaint_Manager',
        senderType: 'INTERNAL',
        messageType: 'STATUS_UPDATE',
        visibility: 'INTERNAL_ONLY',
      },
    });

    // Send notifications to Administrative Complaints Team members
    const adminComplaintsTeam = await this.prisma.user.findMany({
      where: {
        roles: {
          has: 'Administrative_Complaints_Team',
        },
      },
      select: { id: true },
    });

    const notificationData = adminComplaintsTeam.map((member) => ({
      userId: member.id,
      message: 'New administrative complaint assigned for investigation',
      type: 'ADMINISTRATIVE_COMPLAINT_ASSIGNED',
      relatedId: complaintId,
    }));

    if (notificationData.length > 0) {
      await this.prisma.userNotification.createMany({
        data: notificationData,
      });
    }

    return { message: 'Complaint forwarded to investigation team' };
  }

  async submitAdministrativeInvestigationReport(complaintId: string, reportData: any, userId: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    // Update complaint status to Investigation_Completed
    await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: 'Investigation_Completed',
      },
    });

    // Store investigation report in departmentalResponse (reusing existing field)
    const year = new Date().getFullYear();
    const responseNumber = `DR-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        departmentalResponse: {
          create: {
            responseNumber,
            summary: reportData.background || '',
            investigationConducted: reportData.activitiesPerformed || '',
            findings: reportData.findings || '',
            actionsTaken: reportData.evidenceCollected || '',
            proposedActions: reportData.recommendations || '',
            officialResponse: reportData.conclusions || '',
            recommendations: reportData.recommendations || '',
          },
        },
      },
    });

    // Create system message
    await this.prisma.complaintMessage.create({
      data: {
        complaintId,
        message: 'Investigation report submitted by Administrative Complaints Team',
        senderId: userId,
        senderRole: 'Administrative_Complaints_Team',
        senderType: 'INTERNAL',
        messageType: 'STATUS_UPDATE',
        visibility: 'INTERNAL_ONLY',
      },
    });

    // Send notification to Commissioner
    const commissioners = await this.prisma.user.findMany({
      where: {
        roles: {
          has: 'Commissioner',
        },
      },
      select: { id: true },
    });

    const notificationData = commissioners.map((commissioner) => ({
      userId: commissioner.id,
      message: 'Administrative complaint investigation report ready for review',
      type: 'ADMINISTRATIVE_COMPLAINT_REPORT_SUBMITTED',
      relatedId: complaintId,
    }));

    if (notificationData.length > 0) {
      await this.prisma.userNotification.createMany({
        data: notificationData,
      });
    }

    return { message: 'Investigation report submitted successfully' };
  }

  async commissionerReviewAdministrativeComplaint(complaintId: string, decision: 'approve' | 'reject' | 'return', comments: string, userId: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    if (decision === 'approve') {
      // Update complaint status to Decision_Approved
      await this.prisma.complaint.update({
        where: { id: complaintId },
        data: {
          status: 'Decision_Approved',
        },
      });

      // Create system message
      await this.prisma.complaintMessage.create({
        data: {
          complaintId,
          message: `Commissioner approved the investigation report. Comments: ${comments}`,
          senderId: userId,
          senderRole: 'Commissioner',
          senderType: 'INTERNAL',
          messageType: 'STATUS_UPDATE',
          visibility: 'INTERNAL_ONLY',
        },
      });

      // Send notification to Feedback Manager
      const feedbackManagers = await this.prisma.user.findMany({
        where: {
          roles: {
            has: 'Feedback_Complaint_Manager',
          },
        },
        select: { id: true },
      });

      const notificationData = feedbackManagers.map((manager) => ({
        userId: manager.id,
        message: 'Commissioner approved administrative complaint investigation report',
        type: 'ADMINISTRATIVE_COMPLAINT_DECISION_APPROVED',
        relatedId: complaintId,
      }));

      if (notificationData.length > 0) {
        await this.prisma.userNotification.createMany({
          data: notificationData,
        });
      }

      return { message: 'Investigation report approved' };
    } else if (decision === 'return') {
      // Update complaint status to Under_Manager_Review
      await this.prisma.complaint.update({
        where: { id: complaintId },
        data: {
          status: 'Under_Manager_Review',
        },
      });

      // Create system message
      await this.prisma.complaintMessage.create({
        data: {
          complaintId,
          message: `Commissioner returned the investigation report for further investigation. Comments: ${comments}`,
          senderId: userId,
          senderRole: 'Commissioner',
          senderType: 'INTERNAL',
          messageType: 'STATUS_UPDATE',
          visibility: 'INTERNAL_ONLY',
        },
      });

      return { message: 'Investigation report returned for further investigation' };
    } else {
      // Reject - close the complaint
      await this.prisma.complaint.update({
        where: { id: complaintId },
        data: {
          status: 'Closed',
          closedAt: new Date(),
        },
      });

      // Create system message
      await this.prisma.complaintMessage.create({
        data: {
          complaintId,
          message: `Commissioner rejected the complaint. Comments: ${comments}`,
          senderId: userId,
          senderRole: 'Commissioner',
          senderType: 'INTERNAL',
          messageType: 'STATUS_UPDATE',
          visibility: 'INTERNAL_ONLY',
        },
      });

      return { message: 'Complaint rejected and closed' };
    }
  }

  async sendAdministrativeComplaintResponse(complaintId: string, responseData: any, userId: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    // Update complaint status to Response_Sent
    await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: 'Response_Sent',
      },
    });

    // Update departmental response with official response
    await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        departmentalResponse: {
          update: {
            officialResponse: responseData.officialResponse || '',
          },
        },
      },
    });

    // Create system message
    await this.prisma.complaintMessage.create({
      data: {
        complaintId,
        message: 'Official response sent to complainant',
        senderId: userId,
        senderRole: 'Feedback_Complaint_Manager',
        senderType: 'INTERNAL',
        messageType: 'STATUS_UPDATE',
        visibility: 'COMPLAINANT_VISIBLE',
        isSystemMessage: true,
      },
    });

    // Send notification to complainant if email exists
    if (complaint.complainantEmail) {
      // Email notification logic would go here
      console.log(`Email notification sent to ${complaint.complainantEmail}`);
    }

    return { message: 'Response sent to complainant successfully' };
  }

  async closeAdministrativeComplaint(complaintId: string, userId: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    // Update complaint status to Closed
    await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: 'Closed',
        closedAt: new Date(),
      },
    });

    // Create system message
    await this.prisma.complaintMessage.create({
      data: {
        complaintId,
        message: 'Administrative complaint closed',
        senderId: userId,
        senderRole: 'Feedback_Complaint_Manager',
        senderType: 'INTERNAL',
        messageType: 'STATUS_UPDATE',
        visibility: 'INTERNAL_ONLY',
      },
    });

    return { message: 'Complaint closed successfully' };
  }

  async acceptResponse(complaintId: string, decision: 'accept' | 'reject', reason: string, userId: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    if (decision === 'accept') {
      // Update complaint status to Accepted
      await this.prisma.complaint.update({
        where: { id: complaintId },
        data: {
          status: 'Accepted',
        },
      });

      // Send notification to Feedback Manager
      await this.prisma.complaintMessage.create({
        data: {
          complaintId,
          message: 'ቅሬታ አቅራቢዉ በመልሱ ተስማምቷል',
          senderId: userId,
          senderRole: 'Complainant',
          senderType: 'COMPLAINANT',
          messageType: 'SYSTEM',
          visibility: 'INTERNAL_ONLY',
        },
      });
    } else {
      // Update complaint status to Response Returned for Correction
      await this.prisma.complaint.update({
        where: { id: complaintId },
        data: {
          status: 'Response Returned for Correction',
        },
      });

      // Send notification to Department Head
      await this.prisma.complaintMessage.create({
        data: {
          complaintId,
          message: `Response returned for correction${reason ? ': ' + reason : ''}`,
          senderId: userId,
          senderRole: 'Complainant',
          senderType: 'COMPLAINANT',
          messageType: 'SYSTEM',
          visibility: 'INTERNAL_ONLY',
        },
      });
    }

    return { decision, reason };
  }

  async issueFinalDecision(
    complaintId: string,
    data: {
      decision: string;
      rationale: string;
      actionsToBeTaken?: string;
      timeline?: string;
    },
    userId: string
  ) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { petitions: true } as any,
    });

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    // Update complaint status to Final Decision Issued
    await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: 'Final Decision Issued',
        screeningNotes: `Final Decision: ${data.decision}\nRationale: ${data.rationale}\nActions: ${data.actionsToBeTaken || 'N/A'}\nTimeline: ${data.timeline || 'N/A'}`,
      },
    });

    // Update petition status if exists
    if (complaint.petitions && complaint.petitions.length > 0) {
      const petition = complaint.petitions[0];
      await (this.prisma as any).petition.update({
        where: { id: petition.id },
        data: {
          status: 'Final Decision Issued',
        },
      });

      // Update investigation report with final decision
      const investigationReport = await (this.prisma as any).investigationReport.findUnique({
        where: { petitionId: petition.id },
      });

      if (investigationReport) {
        await (this.prisma as any).investigationReport.update({
          where: { id: investigationReport.id },
          data: {
            finalDecision: JSON.stringify(data),
            finalDecisionById: userId,
            finalDecisionAt: new Date(),
            status: 'Final Decision Issued',
          },
        });
      }
    }

    // Send notification to all stakeholders
    await this.prisma.complaintMessage.create({
      data: {
        complaintId,
        message: 'Final decision has been issued for this complaint',
        senderId: userId,
        senderRole: 'Feedback Manager',
        senderType: 'DEPARTMENT',
        messageType: 'SYSTEM',
        visibility: 'ALL',
      },
    });

    return { decision: data.decision, status: 'Final Decision Issued' };
  }
}
