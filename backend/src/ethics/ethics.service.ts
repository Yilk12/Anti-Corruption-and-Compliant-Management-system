import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { NotificationService } from '../common/notification.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EthicsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService
  ) {}

  // Complaint Management
  async createComplaint(createComplaintDto: CreateComplaintDto, userId: string) {
    // Generate reference number
    const year = new Date().getFullYear();
    const count = await this.prisma.complaint.count({
      where: {
        referenceNumber: {
          startsWith: `FCSC-${year}`,
        },
      },
    });
    const referenceNumber = `FCSC-${year}-${String(count + 1).padStart(4, '0')}`;

    // Generate tracking ID and verification secret for all complaints
    let trackingId = null;
    let verificationSecret = null;
    let anonymousToken = null;
    
    // Generate random tracking ID: FCSC-2026-A8K7M2Q9
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomPart = '';
    for (let i = 0; i < 8; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    trackingId = `FCSC-${year}-${randomPart}`;
    
    // Generate verification secret: 6-digit number
    verificationSecret = createComplaintDto.verificationSecret || 
      Math.floor(100000 + Math.random() * 900000).toString();
    
    // Generate anonymous token (UUID) for public complaints to use as senderId
    if (createComplaintDto.isInternal === false) {
      anonymousToken = crypto.randomUUID();
    }

    const complaint = await this.prisma.complaint.create({
      data: {
        referenceNumber,
        trackingId,
        verificationSecret,
        anonymousToken,
        reportingChannel: createComplaintDto.reportingChannel || 'employee',
        isAnonymous: createComplaintDto.isAnonymous,
        isInternal: createComplaintDto.isInternal ?? false,
        complainantName: createComplaintDto.isAnonymous ? null : createComplaintDto.complainantName,
        complainantEmail: createComplaintDto.isAnonymous ? null : createComplaintDto.complainantEmail,
        complainantPhone: createComplaintDto.isAnonymous ? null : createComplaintDto.complainantPhone,
        complainantDepartment: createComplaintDto.complainantDepartment,
        complainantPosition: createComplaintDto.complainantPosition,
        category: createComplaintDto.category,
        institution: createComplaintDto.institution,
        departmentName: createComplaintDto.department,
        subject: createComplaintDto.subject,
        perpetratorPosition: createComplaintDto.perpetratorPosition,
        incidentDate: createComplaintDto.incidentDate ? new Date(createComplaintDto.incidentDate) : null,
        incidentLocation: createComplaintDto.incidentLocation,
        description: createComplaintDto.description,
        priority: createComplaintDto.priority,
        consentDeclaration: createComplaintDto.consentDeclaration,
        consentAccuracy: createComplaintDto.consentAccuracy,
        status: 'Submitted',
        submittedAt: new Date(),
        createdBy: userId,
      },
    });

    // Create notification for ethics officers when a complaint is created
    try {
      // Get all ethics officers and ethics anti-corruption users
      const ethicsOfficers = await this.prisma.user.findMany({
        where: {
          OR: [
            { roles: { has: 'Ethics_Officer' } },
            { roles: { has: 'ethics_officer' } },
            { roles: { has: 'Ethics_Anti_Corruption' } },
            { roles: { has: 'ethics_anti_corruption' } },
          ],
        },
      });

      // Send notification to each ethics officer
      for (const officer of ethicsOfficers) {
        await this.notificationService.createNotification(
          officer.id,
          'New Complaint Created',
          `${referenceNumber} - Anti-Corruption`,
          'COMPLAINT',
        );
      }
      console.log(`Created ${ethicsOfficers.length} notifications for complaint ${referenceNumber}`);
    } catch (error) {
      console.error('Failed to create notification for complaint:', error);
    }

    return complaint;
  }

  async trackComplaint(trackingId: string) {
    const complaint = await this.prisma.complaint.findFirst({
      where: {
        trackingId: trackingId,
      },
      select: {
        id: true,
        trackingId: true,
        referenceNumber: true,
        status: true,
        category: true,
        subject: true,
        description: true,
        submittedAt: true,
        screenedAt: true,
        registeredAt: true,
        closedAt: true,
        priority: true,
        incidentDate: true,
        incidentLocation: true,
        complainantName: true,
        complainantEmail: true,
        complainantPhone: true,
      },
    });

    if (!complaint) {
      throw new NotFoundException('Invalid tracking ID');
    }

    return complaint;
  }

  async getMessagesByTrackingId(trackingId: string) {
    const complaint = await this.prisma.complaint.findFirst({
      where: {
        trackingId: trackingId,
      },
      select: { id: true },
    });

    if (!complaint) {
      throw new NotFoundException('Invalid tracking ID');
    }

    const messages = await this.prisma.complaintMessage.findMany({
      where: {
        complaintId: complaint.id,
        visibility: 'COMPLAINANT_VISIBLE',
      },
      orderBy: {
        sentAt: 'asc',
      },
    });

    // Fetch sender details for each message
    const messagesWithSenders = await Promise.all(
      messages.map(async (msg) => {
        let sender = null;
        // Only try to fetch user if senderId is not 'anonymous'
        if (msg.senderId && msg.senderId !== 'anonymous') {
          try {
            sender = await this.prisma.user.findUnique({
              where: { id: msg.senderId },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            });
          } catch (error) {
            console.error('Failed to fetch sender for message:', msg.id, error);
          }
        }

        return {
          id: msg.id,
          message: msg.message,
          messageType: msg.messageType,
          senderType: msg.senderType,
          sender: sender,
          createdAt: msg.sentAt,
          readAt: msg.readAt,
        };
      })
    );

    return {
      messages: messagesWithSenders,
    };
  }

  async sendMessageByTrackingId(trackingId: string, message: string) {
    console.log('[sendMessageByTrackingId] Looking up trackingId:', trackingId);
    
    try {
      const complaint = await this.prisma.complaint.findFirst({
        where: {
          trackingId: trackingId,
        },
        select: { id: true, createdBy: true, complainantEmail: true, anonymousToken: true, isAnonymous: true },
      });

      console.log('[sendMessageByTrackingId] Complaint found:', !!complaint);

      if (!complaint) {
        throw new NotFoundException('Invalid tracking ID');
      }

      // For anonymous complaints, use anonymousToken as senderId
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
          const newAnonymousToken = crypto.randomUUID();
          await this.prisma.complaint.update({
            where: { id: complaint.id },
            data: { anonymousToken: newAnonymousToken },
          });
          console.log('[sendMessageByTrackingId] Generated new anonymousToken:', newAnonymousToken);
        }
      } else if (!senderId) {
        // For non-anonymous complaints without createdBy, use anonymousToken as fallback
        senderId = complaint.anonymousToken;
      }

      console.log('[sendMessageByTrackingId] Using senderId:', senderId, 'senderRole:', senderRole, 'createdBy:', complaint.createdBy, 'anonymousToken:', complaint.anonymousToken);

      // Create message from complainant
      const newMessage = await this.prisma.complaintMessage.create({
        data: {
          complaintId: complaint.id,
          senderId: senderId,
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

      console.log('[sendMessageByTrackingId] Message created successfully:', newMessage.id);

      // Notify ethics officers about new message (non-blocking)
      this.notifyEthicsOfficersAboutMessage(complaint.id).catch(err => {
        console.error('Failed to notify ethics officers:', err);
      });

      return newMessage;
    } catch (error) {
      console.error('[sendMessageByTrackingId] Error:', error);
      console.error('[sendMessageByTrackingId] Error stack:', error instanceof Error ? error.stack : 'No stack');
      throw error;
    }
  }

  private async notifyEthicsOfficersAboutMessage(complaintId: string) {
    try {
      const ethicsOfficers = await this.prisma.user.findMany({
        where: {
          OR: [
            { roles: { has: 'Ethics_Officer' } },
            { roles: { has: 'ethics_officer' } },
            { roles: { has: 'Ethics_Anti_Corruption' } },
            { roles: { has: 'ethics_anti_corruption' } },
          ],
        },
      });

      for (const officer of ethicsOfficers) {
        await this.notificationService.createNotification(
          officer.id,
          'New Message from Complainant',
          `Complainant sent a message regarding their complaint`,
          'MESSAGE',
        );
      }
    } catch (error) {
      console.error('Failed to create notification for new message:', error);
    }
  }

  async screenComplaint(complaintId: string, screeningData: any, screenerId: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    // Check for duplicates based on similar details
    const duplicates = await this.prisma.complaint.findMany({
      where: {
        id: { not: complaintId },
        OR: [
          { complainantEmail: complaint.complainantEmail },
          { description: { contains: complaint.description.substring(0, 100), mode: 'insensitive' } },
        ],
      },
    });

    const isDuplicate = duplicates.length > 0;
    const duplicateReference = isDuplicate ? duplicates[0].referenceNumber : null;

    // Determine status based on recommendation
    let newStatus = 'Registered';
    if (screeningData.recommendation === 'Reject') {
      newStatus = 'Closed';
    } else if (screeningData.recommendation === 'Request More Info') {
      newStatus = 'Submitted'; // Keep in submitted state for more info
    } else if (screeningData.recommendation === 'Investigate') {
      newStatus = 'Triage'; // Move to triage for assessment
    } else if (screeningData.recommendation === 'Register') {
      newStatus = 'Registered'; // Register the case
    }

    const updatedComplaint = await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        screeningNotes: screeningData.screeningNotes,
        isDuplicate: screeningData.isDuplicate || isDuplicate,
        duplicateReference: screeningData.duplicateReference || duplicateReference,
        safetyRisk: screeningData.safetyRisk,
        retaliationRisk: screeningData.retaliationRisk,
        confidentialityLevel: screeningData.confidentialityLevel,
        documentsVerified: screeningData.documentsVerified,
        documentsRequired: screeningData.documentsRequired,
        screenedById: screenerId,
        screenedAt: new Date(),
        status: newStatus,
        registeredAt: newStatus === 'Registered' ? new Date() : complaint.registeredAt,
        closedAt: newStatus === 'Closed' ? new Date() : null,
      },
    });

    return updatedComplaint;
  }

  // Step 3: Initial Assessment (Assessment / Triage Officer)
  async assessComplaint(complaintId: string, assessmentData: any, assessorId: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    const updatedComplaint = await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        assessmentNotes: assessmentData.assessmentNotes,
        jurisdictionCheck: assessmentData.jurisdictionCheck,
        credibilityCheck: assessmentData.credibilityCheck,
        urgencyCheck: assessmentData.urgencyCheck,
        conflictCheck: assessmentData.conflictCheck,
        recommendedRoute: assessmentData.recommendedRoute,
        recommendedReferral: assessmentData.recommendedReferral,
        assessedById: assessorId,
        assessedAt: new Date(),
        status: assessmentData.recommendedRoute === 'Investigation' ? 'Awaiting Approval' : 'Referred',
      },
    });

    return updatedComplaint;
  }

  // Step 4: Approve Investigation Route (Investigation Supervisor)
  async approveInvestigationRoute(complaintId: string, approvalData: any, approverId: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    const updatedComplaint = await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: approvalData.approved ? 'Under Investigation' : 'Under Assessment',
      },
    });

    return updatedComplaint;
  }

  // Step 5: Assign Investigator (Investigation Supervisor)
  async assignInvestigator(complaintId: string, assigneeId: string, assignedById: string, assignmentData: any) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    // Check if investigation already exists
    const existingInvestigation = await this.prisma.investigation.findUnique({
      where: { complaintId },
    });

    let investigation;

    if (existingInvestigation) {
      // Update existing investigation
      investigation = await this.prisma.investigation.update({
        where: { complaintId },
        data: {
          assignedInvestigatorId: assigneeId,
          assignedSupervisorId: assignedById,
          assignedById: assignedById,
          scope: assignmentData.scope || existingInvestigation.scope,
          objectives: assignmentData.objectives || existingInvestigation.objectives,
          investigationPlan: assignmentData.investigationPlan || existingInvestigation.investigationPlan,
          targetCompletionDate: assignmentData.targetCompletionDate || existingInvestigation.targetCompletionDate,
        },
      });
    } else {
      // Create new investigation record
      const year = new Date().getFullYear();
      const count = await this.prisma.investigation.count({
        where: {
          caseNumber: {
            startsWith: `CASE-${year}`,
          },
        },
      });
      const caseNumber = `CASE-${year}-${String(count + 1).padStart(4, '0')}`;

      investigation = await this.prisma.investigation.create({
        data: {
          caseNumber,
          complaintId,
          assignedInvestigatorId: assigneeId,
          assignedSupervisorId: assignedById,
          assignedById: assignedById,
          scope: assignmentData.scope,
          objectives: assignmentData.objectives,
          investigationPlan: assignmentData.investigationPlan,
          startDate: new Date(),
          targetCompletionDate: assignmentData.targetCompletionDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'Under Investigation',
        },
      });
    }

    // Update complaint status
    await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: 'Under Investigation',
        assignedAt: new Date(),
      },
    });

    // Send system message about assignment
    await this.prisma.complaintMessage.create({
      data: {
        complaintId,
        senderId: assignedById,
        senderType: 'DEPARTMENT',
        senderRole: 'Ethics_Anti_Corruption',
        message: `Investigation ${investigation.caseNumber} has been assigned to investigator.`,
        messageType: 'STATUS_UPDATE',
        visibility: 'COMPLAINANT_VISIBLE',
        isSystemMessage: true,
        deliveryStatus: 'SENT',
      },
    });

    return investigation;
  }

  // Step 6: Investigator submits report
  async submitInvestigationReport(investigationId: string, reportData: any, investigatorId: string) {
    const investigation = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
    });

    if (!investigation) {
      throw new NotFoundException('Investigation not found');
    }

    const updatedInvestigation = await this.prisma.investigation.update({
      where: { id: investigationId },
      data: {
        findings: reportData.findings,
        recommendation: reportData.recommendation,
        reportSubmittedAt: new Date(),
        reportSubmittedById: investigatorId,
        status: 'Report Submitted',
      },
    });

    // Update complaint status
    await this.prisma.complaint.update({
      where: { id: investigation.complaintId },
      data: {
        status: 'Report Submitted',
      },
    });

    return updatedInvestigation;
  }

  // Step 7: Review Investigation Report (Reviewer / Supervisor)
  async reviewInvestigationReport(investigationId: string, reviewData: any, reviewerId: string) {
    const investigation = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
    });

    if (!investigation) {
      throw new NotFoundException('Investigation not found');
    }

    // Update investigation with findings, recommendation, decision, and outcome
    const updatedInvestigation = await this.prisma.investigation.update({
      where: { id: investigationId },
      data: {
        findings: reviewData.findings,
        recommendation: reviewData.recommendation,
        decision: reviewData.decision,
        outcome: reviewData.outcome,
        status: 'Under Review',
        actualCompletionDate: new Date(),
      },
    });

    // Update complaint status
    await this.prisma.complaint.update({
      where: { id: investigation.complaintId },
      data: {
        status: 'Under Review',
      },
    });

    return updatedInvestigation;
  }

  // Step 8: Approve Decision or Referral (Authorized Decision-Maker)
  async approveDecision(investigationId: string, decisionData: any, decisionMakerId: string) {
    const investigation = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
    });

    if (!investigation) {
      throw new NotFoundException('Investigation not found');
    }

    const updatedInvestigation = await this.prisma.investigation.update({
      where: { id: investigationId },
      data: {
        decision: decisionData.decision,
        outcome: decisionData.outcome,
        decisionAuthority: decisionData.decisionAuthority,
        decisionById: decisionMakerId,
        decisionDate: new Date(),
        status: decisionData.isReferral ? 'Referred' : 'Closed',
        actualCompletionDate: new Date(),
      },
    });

    // Handle referral if applicable
    if (decisionData.isReferral) {
      await this.prisma.investigation.update({
        where: { id: investigationId },
        data: {
          referralInstitution: decisionData.referralInstitution,
          referralReason: decisionData.referralReason,
          referralDate: new Date(),
          referralApprovedById: decisionMakerId,
        },
      });
    }

    // Update complaint status
    await this.prisma.complaint.update({
      where: { id: investigation.complaintId },
      data: {
        status: decisionData.isReferral ? 'Referred' : 'Closed',
        closedAt: new Date(),
      },
    });

    return updatedInvestigation;
  }

  // Step 9: Close Case (Case Management Officer)
  async closeCase(investigationId: string, closureData: any, closerId: string) {
    const investigation = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
      include: {
        complaint: true,
      },
    });

    if (!investigation) {
      throw new NotFoundException('Investigation not found');
    }

    const updatedInvestigation = await this.prisma.investigation.update({
      where: { id: investigationId },
      data: {
        closureReason: closureData.closureReason,
        followUpActions: closureData.followUpActions,
        closedById: closerId,
        closedAt: new Date(),
        status: 'Closed',
      },
    });

    // Update complaint status
    await this.prisma.complaint.update({
      where: { id: investigation.complaintId },
      data: {
        status: 'Closed',
        closedAt: new Date(),
      },
    });

    // Send response message to complainant if provided
    if (closureData.responseMessage && investigation.complaint) {
      await this.prisma.complaintMessage.create({
        data: {
          complaintId: investigation.complaintId,
          senderId: closerId,
          senderType: 'DEPARTMENT',
          senderRole: 'Ethics_Officer',
          message: closureData.responseMessage,
          messageType: 'REPLY',
          visibility: 'COMPLAINANT_VISIBLE',
          isSystemMessage: false,
          deliveryStatus: 'SENT',
        },
      });
    }

    return updatedInvestigation;
  }

  async sendMessageToComplainant(complaintId: string, message: string, senderId: string, senderRole: string, senderType: string = 'DEPARTMENT', messageType: string = 'REPLY', visibility: string = 'COMPLAINANT_VISIBLE') {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    const newMessage = await this.prisma.complaintMessage.create({
      data: {
        complaintId,
        senderId: senderId || null,
        senderType,
        senderRole,
        message,
        messageType,
        visibility,
        isSystemMessage: false,
        deliveryStatus: 'SENT',
      },
    });

    return newMessage;
  }

  async getComplaintMessages(complaintId: string, userId?: string, userRoles?: string[]) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
      select: { createdBy: true, anonymousToken: true, complainantEmail: true },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    // Security: Complainants can only see their own complaint messages
    // Department officers can see messages for complaints they have access to
    let isComplainant = complaint.createdBy === userId;
    
    // Fallback: If createdBy is null, try to match by email
    if (!isComplainant && complaint.complainantEmail && userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      if (user && user.email === complaint.complainantEmail) {
        isComplainant = true;
      }
    }
    
    // Normalize roles to uppercase for case-insensitive comparison
    const normalizedRoles = userRoles?.map(r => r.toUpperCase()) || [];
    const isDepartmentOfficer = normalizedRoles.some(role =>
      ['ETHICS_OFFICER', 'ETHICS_ANTI_CORRUPTION', 'ADMIN', 'ADMINISTRATOR'].includes(role)
    );

    console.log(`[getComplaintMessages] Complaint ID: ${complaintId}, User ID: ${userId}, Complainant ID: ${complaint.createdBy}, Complainant Email: ${complaint.complainantEmail}, Is Complainant: ${isComplainant}, Roles: ${JSON.stringify(userRoles)}, Normalized Roles: ${JSON.stringify(normalizedRoles)}, Is Department Officer: ${isDepartmentOfficer}`);

    // Allow access if user is the complainant OR a department officer
    // If userId is undefined but user has valid roles, still allow access for department officers
    if (!isComplainant && !isDepartmentOfficer) {
      throw new NotFoundException('Access denied: You are not authorized to view messages for this complaint');
    }

    const messages = await this.prisma.complaintMessage.findMany({
      where: {
        complaintId,
        // Complainants can only see COMPLAINANT_VISIBLE messages
        ...(isComplainant && !isDepartmentOfficer ? { visibility: 'COMPLAINANT_VISIBLE' } : {}),
      },
      orderBy: { sentAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return messages;
  }

  async markMessageAsRead(messageId: string, userId: string) {
    const message = await this.prisma.complaintMessage.findUnique({
      where: { id: messageId },
      include: { complaint: true },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Security: Only the recipient can mark as read
    const isComplainant = message.complaint.createdBy === userId;
    const isDepartmentOfficer = message.senderType === 'COMPLAINANT';

    if (!isComplainant && !isDepartmentOfficer) {
      throw new NotFoundException('Access denied');
    }

    return this.prisma.complaintMessage.update({
      where: { id: messageId },
      data: { readAt: new Date(), deliveryStatus: 'READ' },
    });
  }

  async getComplaintsByComplainant(userId: string) {
    console.log(`[getComplaintsByComplainant] Fetching complaints for user ID: ${userId}`);
    const complaints = await this.prisma.complaint.findMany({
      where: { createdBy: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          where: { visibility: 'COMPLAINANT_VISIBLE' },
          orderBy: { sentAt: 'desc' },
          take: 1,
        },
      },
    });
    console.log(`[getComplaintsByComplainant] Found ${complaints.length} complaints for user ID: ${userId}`);
    return JSON.parse(JSON.stringify(complaints));
  }

  async getDepartmentInbox(status?: string) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const result = await this.prisma.complaint.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
        },
      },
    });
    return JSON.parse(JSON.stringify(result));
  }

  async getUnreadMessageCount() {
    // Count complaints where the latest message is from complainant and unread
    const complaints = await this.prisma.complaint.findMany({
      where: {
        messages: {
          some: {
            readAt: null,
          },
        },
      },
      include: {
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
        },
      },
    });

    // Count only those where the latest message is unread
    let unreadCount = 0;
    for (const complaint of complaints) {
      if (complaint.messages.length > 0 && complaint.messages[0].readAt === null) {
        unreadCount++;
      }
    }

    return { count: unreadCount };
  }

  async assignComplaintForInvestigation(complaintId: string, assigneeId: string, assignedById: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    const updatedComplaint = await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        assigneeId,
        assignedAt: new Date(),
        status: 'Under Investigation',
      },
    });

    // Create investigation record
    const year = new Date().getFullYear();
    const count = await this.prisma.investigation.count({
      where: {
        caseNumber: {
          startsWith: `CASE-${year}`,
        },
      },
    });
    const caseNumber = `CASE-${year}-${String(count + 1).padStart(4, '0')}`;

    const investigation = await this.prisma.investigation.create({
      data: {
        caseNumber,
        complaintId,
        startDate: new Date(),
        targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'Preliminary Assessment',
      },
    });

    // Send system message about assignment
    await this.prisma.complaintMessage.create({
      data: {
        complaintId,
        senderId: assignedById,
        senderType: 'DEPARTMENT',
        senderRole: 'Department_Head',
        message: `Complaint has been assigned for investigation. Case Number: ${caseNumber}`,
        messageType: 'STATUS_UPDATE',
        visibility: 'COMPLAINANT_VISIBLE',
        isSystemMessage: true,
        deliveryStatus: 'SENT',
      },
    });

    return { complaint: updatedComplaint, investigation };
  }

  async findAllComplaints(filters: {
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
    userId?: string;
    isInvestigator?: boolean;
  }) {
    const where: any = {};

    console.log('[findAllComplaints] filters:', filters);

    // If user is an investigator (Ethics Officer), only show complaints assigned to them
    // Ethics Anti-Corruption users can see all complaints (oversight role)
    // This automatically excludes complaints with no assignee (assigneeId is null) for Ethics Officers
    if (filters.isInvestigator && filters.userId) {
      // Don't filter by assigneeId - let Ethics Anti-Corruption see all complaints
      // Only filter for Ethics Officers if needed in the future
      console.log('[findAllComplaints] User is investigator, showing all complaints');
    } else if (filters.userId && !filters.isInvestigator) {
      // For non-investigators (e.g., END_USER), show only their own complaints
      where.createdBy = filters.userId;
      console.log('[findAllComplaints] Filtering for user with userId:', filters.userId);
    }

    if (filters.status && filters.status !== 'all') {
      where.status = filters.status;
    }
    if (filters.category && filters.category !== 'all') {
      where.category = filters.category;
    }
    if (filters.priority && filters.priority !== 'all') {
      where.priority = filters.priority;
    }
    if (filters.search) {
      where.OR = [
        { referenceNumber: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { complainantName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    console.log('[findAllComplaints] where clause:', where);

    const result = await this.prisma.complaint.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Serialize to ensure only selected fields are returned
    return JSON.parse(JSON.stringify(result));
  }

  async findComplaintById(id: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        investigation: true,
        evidence: true,
      },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    return JSON.parse(JSON.stringify(complaint));
  }

  async updateComplaint(id: string, updateData: any) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    // Convert incidentDate from date string to DateTime if provided
    if (updateData.incidentDate && typeof updateData.incidentDate === 'string') {
      // If it's just a date (YYYY-MM-DD), append time to make it ISO-8601 DateTime
      if (!updateData.incidentDate.includes('T')) {
        updateData.incidentDate = `${updateData.incidentDate}T00:00:00.000Z`;
      }
    }

    return this.prisma.complaint.update({
      where: { id },
      data: updateData,
    });
  }

  async assignComplaint(id: string, assigneeId: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    const assignee = await this.prisma.user.findUnique({
      where: { id: assigneeId },
    });

    if (!assignee) {
      throw new BadRequestException('Assignee not found');
    }

    return this.prisma.complaint.update({
      where: { id },
      data: {
        assigneeId,
        status: 'Under Investigation',
      },
    });
  }

  // Investigation Management
  async createInvestigation(data: any, userId: string) {
    // Generate case number
    const year = new Date().getFullYear();
    const count = await this.prisma.investigation.count({
      where: {
        caseNumber: {
          startsWith: `CASE-${year}`,
        },
      },
    });
    const caseNumber = `CASE-${year}-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.investigation.create({
      data: {
        caseNumber,
        complaintId: data.complaintId,
        assignedInvestigatorId: data.assignedInvestigatorId,
        assignedSupervisorId: data.assignedSupervisorId,
        status: 'Preliminary Assessment',
        startDate: new Date(),
        targetCompletionDate: new Date(data.targetCompletionDate),
      },
    });
  }

  async updateInvestigationPlan(investigationId: string, planData: any, investigatorId: string) {
    const investigation = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
    });

    if (!investigation) {
      throw new NotFoundException('Investigation not found');
    }

    const updatedInvestigation = await this.prisma.investigation.update({
      where: { id: investigationId },
      data: {
        scope: planData.scope,
        objectives: planData.objectives,
        investigationPlan: planData.investigationPlan,
        status: 'Under Investigation', // Move to under investigation status when plan is submitted
      },
    });

    return updatedInvestigation;
  }

  async findAllInvestigations(filters: {
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
    overdue?: boolean;
    userId?: string;
    isInvestigator?: boolean;
    bypassUserFilter?: boolean;
  }) {
    const where: any = {
      complaint: {
        isFeedback: false, // Only return ethics investigations (not feedback)
      },
    };

    console.log('[findAllInvestigations] filters:', filters);

    // If user is an investigator (Ethics Officer or Ethics Anti-Corruption), only show investigations assigned to them
    // unless bypassUserFilter is true (for received reports page)
    if (!filters.bypassUserFilter) {
      if (filters.isInvestigator && filters.userId) {
        where.assignedInvestigatorId = filters.userId;
        console.log('[findAllInvestigations] Filtering for investigator with userId:', filters.userId);
      } else {
        // For all other cases, exclude unassigned investigations
        where.assignedInvestigatorId = { not: null };
        console.log('[findAllInvestigations] Excluding unassigned investigations');
      }
    }

    if (filters.status && filters.status !== 'all') {
      where.status = filters.status;
    }
    if (filters.search) {
      where.OR = [
        { caseNumber: { contains: filters.search, mode: 'insensitive' } },
        { complaint: { referenceNumber: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }
    if (filters.overdue) {
      where.actualCompletionDate = null;
      where.targetCompletionDate = { lt: new Date() };
    }

    const investigations = await this.prisma.investigation.findMany({
      where,
      include: {
        complaint: {
          select: {
            referenceNumber: true,
            category: true,
            priority: true,
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
            email: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    // Flatten complaint fields to top level for frontend
    return investigations.map((investigation) => ({
      ...investigation,
      complaintReference: investigation.complaint?.referenceNumber,
      category: investigation.complaint?.category,
      priority: investigation.complaint?.priority,
    }));
  }

  async findInvestigationById(id: string) {
    const investigation = await this.prisma.investigation.findUnique({
      where: { id },
      include: {
        complaint: true,
        assignedInvestigator: true,
        assignedSupervisor: true,
        activities: true,
        evidence: true,
      },
    });

    if (!investigation) {
      throw new NotFoundException('Investigation not found');
    }

    // Remove password field from user objects
    const sanitizedInvestigation = JSON.parse(JSON.stringify(investigation, (key, value) => {
      if (key === 'password') return undefined;
      return value;
    }));

    // Flatten complaint fields to top level for frontend
    return {
      ...sanitizedInvestigation,
      complaintReference: investigation.complaint?.referenceNumber,
      category: investigation.complaint?.category,
      priority: investigation.complaint?.priority,
    };
  }

  async updateInvestigation(id: string, updateData: any, userId: string) {
    const investigation = await this.prisma.investigation.findUnique({
      where: { id },
    });

    if (!investigation) {
      throw new NotFoundException('Investigation not found');
    }

    const updatedInvestigation = await this.prisma.investigation.update({
      where: { id },
      data: {
        ...(updateData.startDate && { startDate: new Date(updateData.startDate) }),
        ...(updateData.targetCompletionDate && { targetCompletionDate: new Date(updateData.targetCompletionDate) }),
        ...(updateData.scope !== undefined && { scope: updateData.scope }),
        ...(updateData.objectives !== undefined && { objectives: updateData.objectives }),
        ...(updateData.investigationPlan !== undefined && { investigationPlan: updateData.investigationPlan }),
        ...(updateData.findings !== undefined && { findings: updateData.findings }),
        ...(updateData.recommendation !== undefined && { recommendation: updateData.recommendation }),
        ...(updateData.decision !== undefined && { decision: updateData.decision }),
        ...(updateData.status && { status: updateData.status }),
        ...(updateData.status === 'Report Submitted' && {
          reportSubmittedAt: new Date(),
          reportSubmittedById: userId,
        }),
      },
    });

    return updatedInvestigation;
  }

  async addEvidenceToInvestigation(investigationId: string, evidenceData: any, userId: string) {
    const investigation = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
    });

    if (!investigation) {
      throw new NotFoundException('Investigation not found');
    }

    const evidence = await this.prisma.evidence.create({
      data: {
        investigationId,
        fileName: evidenceData.title || evidenceData.digitalFileName || 'Untitled',
        fileType: evidenceData.type || 'Document',
        fileSize: 0,
        filePath: evidenceData.storageLocation || '',
        description: evidenceData.description,
        uploadedBy: userId,
      },
    });

    return evidence;
  }

  async addActivityToInvestigation(investigationId: string, activityData: any, userId: string) {
    const investigation = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
    });

    if (!investigation) {
      throw new NotFoundException('Investigation not found');
    }

    const activity = await this.prisma.investigationActivity.create({
      data: {
        investigationId,
        activityType: activityData.activityType || 'Interview',
        description: activityData.purpose || activityData.description || '',
        activityDate: activityData.interviewDate ? new Date(activityData.interviewDate) : new Date(),
        conductedBy: userId,
        outcomes: activityData.keyFacts || activityData.responses || '',
      },
    });

    return activity;
  }

  // Statistics
  async getStatistics() {
    const [
      totalComplaints,
      underInvestigation,
      overdueCases,
      pendingDeclarations,
      highRiskItems,
      receivedInvestigations,
      complaintsByCategoryData,
      casesByStatusData,
    ] = await Promise.all([
      this.prisma.complaint.count(),
      this.prisma.investigation.count({
        where: { status: 'Under Investigation' },
      }),
      this.prisma.investigation.count({
        where: {
          actualCompletionDate: null,
          targetCompletionDate: { lt: new Date() },
        },
      }),
      this.prisma.declaration.count({
        where: { status: 'Under Review' },
      }),
      this.prisma.riskAssessment.count({
        where: { inherentRisk: 'Critical' },
      }),
      this.prisma.investigation.count({
        where: {
          status: 'Report Submitted',
        },
      }),
      // Complaints by category
      this.prisma.complaint.groupBy({
        by: ['category'],
        _count: {
          category: true,
        },
      }),
      // Cases by status (investigations)
      this.prisma.investigation.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
      }),
    ]);

    // Format complaints by category for chart
    const complaintsByCategory = complaintsByCategoryData.map((item) => ({
      category: item.category,
      count: item._count.category,
    }));

    // Format cases by status for chart
    const casesByStatus = casesByStatusData.map((item) => ({
      status: item.status,
      count: item._count.status,
    }));

    // Calculate compliance score (0-100)
    // Based on: closed investigations, approved declarations
    const closedInvestigations = await this.prisma.investigation.count({
      where: { status: 'Closed' },
    });
    const totalInvestigations = await this.prisma.investigation.count();
    const investigationScore = totalInvestigations > 0 ? (closedInvestigations / totalInvestigations) * 50 : 0;

    const approvedDeclarations = await this.prisma.declaration.count({
      where: { status: 'Approved' },
    });
    const totalDeclarations = await this.prisma.declaration.count();
    const declarationScore = totalDeclarations > 0 ? (approvedDeclarations / totalDeclarations) * 50 : 0;

    const complianceScore = Math.min(100, Math.round(investigationScore + declarationScore));

    return {
      totalComplaints,
      underInvestigation,
      overdueCases,
      pendingDeclarations,
      highRiskItems,
      receivedInvestigations,
      closedCases: closedInvestigations,
      complaintsByCategory,
      casesByStatus,
      complianceScore,
    };
  }

  // Policy Management
  async createPolicy(body: any, files: Express.Multer.File[], userId: string) {
    const fs = require('fs');
    const path = require('path');

    // Generate document number
    const year = new Date().getFullYear();
    const count = await this.prisma.policy.count({
      where: {
        documentNumber: {
          startsWith: `POL-${year}`,
        },
      },
    });
    const documentNumber = `POL-${year}-${String(count + 1).padStart(4, '0')}`;

    // Handle file uploads
    let filePath = null;
    let fileSize = null;

    if (files && files.length > 0) {
      const uploadDir = path.join(process.cwd(), 'uploads', 'policies');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Save the first file (main document)
      const file = files[0];
      const fileName = `${documentNumber}-${file.originalname}`;
      const fullPath = path.join(uploadDir, fileName);
      
      fs.writeFileSync(fullPath, file.buffer);
      
      filePath = `/uploads/policies/${fileName}`;
      fileSize = file.size;
    }

    const policyData = {
      documentNumber,
      title: body.title,
      policyType: body.category || 'Policy',
      version: '1.0',
      effectiveDate: new Date(body.effectiveDate),
      status: body.status || 'Draft',
      description: body.description,
      filePath,
      fileSize,
    };

    const policy = await this.prisma.policy.create({
      data: policyData,
    });

    return policy;
  }

  async findAllPolicies(filters: {
    category?: string;
    status?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters.category && filters.category !== 'all') {
      where.policyType = filters.category;
    }
    if (filters.status && filters.status !== 'all') {
      where.status = filters.status;
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.policy.findMany({
      where,
      orderBy: { effectiveDate: 'desc' },
    });
  }

  async downloadPolicy(id: string, res: any) {
    const fs = require('fs');
    const path = require('path');

    const policy = await this.prisma.policy.findUnique({
      where: { id },
    });

    if (!policy || !policy.filePath) {
      throw new NotFoundException('Policy file not found');
    }

    const fullPath = path.join(process.cwd(), policy.filePath);

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('File not found on server');
    }

    res.download(fullPath, policy.filePath.split('/').pop());
  }

  // Declaration Management
  async createDeclaration(body: any, files: Express.Multer.File[], userId: string) {
    // Generate declaration number
    const year = new Date().getFullYear();
    const count = await this.prisma.declaration.count({
      where: {
        declarationNumber: {
          startsWith: `DECL-${year}`,
        },
      },
    });
    const declarationNumber = `DECL-${year}-${String(count + 1).padStart(4, '0')}`;

    const declarationData = {
      declarationNumber,
      declarantId: userId,
      declarationType: body.type || 'Conflict of Interest',
      relationshipDescription: body.description,
      estimatedValue: body.amount ? parseFloat(body.amount) : null,
      relatedOrganization: body.relationship,
      dateDisclosed: new Date(),
      status: body.status || 'Submitted',
      submittedAt: new Date(),
    };

    const declaration = await this.prisma.declaration.create({
      data: declarationData,
    });

    // Handle file attachments if needed
    // This would require a DeclarationAttachment model in Prisma schema
    // For now, we'll just return the created declaration

    return declaration;
  }

  async findAllDeclarations(filters: {
    type?: string;
    status?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters.type && filters.type !== 'all') {
      where.declarationType = filters.type;
    }
    if (filters.status && filters.status !== 'all') {
      where.status = filters.status;
    }
    if (filters.search) {
      where.OR = [
        { declarationNumber: { contains: filters.search, mode: 'insensitive' } },
        { relationshipDescription: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.declaration.findMany({
      where,
      orderBy: { dateDisclosed: 'desc' },
      include: {
        declarant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async uploadEvidenceFiles(investigationId: string, files: Express.Multer.File[], evidenceData: any) {
    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads', 'ethics-evidence');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const createdEvidence = [];

    for (const file of files) {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = `${uniqueSuffix}-${file.originalname}`;
      const filepath = path.join(uploadDir, filename);

      // Save file
      fs.writeFileSync(filepath, file.buffer);

      // Create evidence record for each file
      const evidence = await this.prisma.evidence.create({
        data: {
          investigationId,
          fileName: file.originalname,
          filePath: `/uploads/ethics-evidence/${filename}`,
          fileType: file.mimetype,
          fileSize: file.size,
          description: evidenceData.description || '',
        },
      });

      createdEvidence.push(evidence);
    }

    return createdEvidence;
  }

  async saveAllegations(investigationId: string, allegations: any[]) {
    // Store allegations as JSON string in investigationPlan field
    const investigation = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
    });

    if (!investigation) {
      throw new NotFoundException('Investigation not found');
    }

    // Update investigation with allegations data as JSON string
    const updatedInvestigation = await this.prisma.investigation.update({
      where: { id: investigationId },
      data: {
        investigationPlan: JSON.stringify(allegations),
      },
    });

    return updatedInvestigation;
  }

  async saveEvidenceBatch(investigationId: string, evidenceRecords: any[]) {
    // Store evidence records as JSON string in evidenceDetails field
    const investigation = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
    });

    if (!investigation) {
      throw new NotFoundException('Investigation not found');
    }

    // Update investigation with evidence records data as JSON string
    const updatedInvestigation = await this.prisma.investigation.update({
      where: { id: investigationId },
      data: {
        evidenceDetails: JSON.stringify(evidenceRecords),
      },
    });

    return updatedInvestigation;
  }

  async saveFindings(investigationId: string, findingsRecords: any[]) {
    // Store findings records as JSON string in findings field
    const investigation = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
    });

    if (!investigation) {
      throw new NotFoundException('Investigation not found');
    }

    // Update investigation with findings records data as JSON string
    const updatedInvestigation = await this.prisma.investigation.update({
      where: { id: investigationId },
      data: {
        findings: JSON.stringify(findingsRecords),
      },
    });

    return updatedInvestigation;
  }
}
