-- CreateEnum
CREATE TYPE "FuelAmountType" AS ENUM ('LITER', 'COUPON', 'CASH');

-- CreateEnum
CREATE TYPE "FuelStatus" AS ENUM ('FUELED', 'NOT_FUELED', 'HALF_FUELED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'Department_Head', 'Commissioner', 'END_USER', 'Driver', 'Maintenace_Team', 'Announcement_Creator', 'Women_Social_Inclusion', 'Feedback_Complaint_Manager', 'Feedback_Complaint_Officer', 'Ethics_Anti_Corruption', 'Ethics_Officer', 'IT_Officer', 'Finance_Department', 'Vehicle_Inspector', 'Administrative_Complaints_Team');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "DisabilityType" AS ENUM ('BLIND', 'DEAF', 'PHYSICAL_OR_MOVEMENT_DISORDER', 'MENTAL_RETARDATION', 'OVERLAPPING_FACES', 'PSYCHOLOGICAL_AND_SOCIAL_DISORDER');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ENABLED', 'DISABLED');

-- CreateEnum
CREATE TYPE "SubmissionType" AS ENUM ('COMPLAINT', 'SUGGESTION', 'COMPLIMENT', 'REQUEST', 'INCIDENT');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('SUBMITTED', 'ACCEPTED', 'REJECTED', 'ESCALATED', 'MORE_INFO_REQUESTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReadStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "RequestDecisionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ACCEPTED', 'NOT_ACCEPTED');

-- CreateEnum
CREATE TYPE "OvertimeType" AS ENUM ('EXTRA_TIME', 'WEEKEND');

-- CreateEnum
CREATE TYPE "OvertimeDurationType" AS ENUM ('HALF_TIME', 'FULL_DAY');

-- CreateTable
CREATE TABLE "FuelRequest" (
    "id" UUID NOT NULL,
    "requestorId" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "odometer" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "amountType" "FuelAmountType" NOT NULL,
    "notes" TEXT,
    "status" "FuelStatus" NOT NULL DEFAULT 'NOT_FUELED',
    "returnOdometerKm" INTEGER,
    "remainingFuelRequest" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OvertimeRequest" (
    "id" UUID NOT NULL,
    "reqId" UUID NOT NULL,
    "departmentId" UUID,
    "overtimeType" "OvertimeType" NOT NULL,
    "durationType" "OvertimeDurationType" NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "dates" TIMESTAMP(3)[],
    "description" TEXT,
    "status" "RequestDecisionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OvertimeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OvertimeNotification" (
    "id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "overtimeRequestId" UUID NOT NULL,
    "departmentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OvertimeNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldNotification" (
    "id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "fieldRequestId" UUID NOT NULL,
    "departmentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FieldNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "status" "RequestDecisionStatus",
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT,
    "relatedId" TEXT,
    "fieldRequestId" UUID,
    "departmentId" UUID,
    "actionByUserId" UUID,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "firstNameAm" TEXT,
    "middleNameAm" TEXT,
    "lastNameAm" TEXT,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "employeeId" TEXT,
    "position" TEXT,
    "photoUrl" TEXT,
    "roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "userType" "UserType" NOT NULL,
    "gender" "Gender",
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,
    "disabilityType" "DisabilityType",
    "departmentId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ENABLED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" SERIAL NOT NULL,
    "userId" UUID NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "nameAm" TEXT,
    "description" TEXT,
    "code" TEXT,
    "headId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "recipientUserId" UUID,
    "departmentId" UUID,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "type" "SubmissionType" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionAttachment" (
    "id" UUID NOT NULL,
    "submissionId" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldRequest" (
    "id" UUID NOT NULL,
    "reqId" UUID NOT NULL,
    "departmentId" UUID,
    "fieldType" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "durationType" TEXT,
    "isRead" "ReadStatus" NOT NULL DEFAULT 'CLOSED',
    "status" "RequestDecisionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverDetaile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "empId" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "address" TEXT,
    "licenceNumber" TEXT NOT NULL,
    "licenceClass" TEXT NOT NULL,
    "licenceExpiredDate" TIMESTAMP(3) NOT NULL,
    "issuedBy" TEXT NOT NULL,
    "vehicleId" UUID,
    "emergencyContactName" TEXT NOT NULL,
    "emergencyContactPhone" TEXT NOT NULL,
    "additionalInformation" TEXT,
    "licenceCertificate" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverDetaile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WomenadnSocilaInclusion" (
    "id" UUID NOT NULL,
    "typeOfMisconduct" TEXT NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "detailDescriptionOfIncident" TEXT,
    "reportedBefore" BOOLEAN NOT NULL,
    "medicalHelpNeeded" BOOLEAN NOT NULL,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "victimId" UUID,
    "departmentId" UUID,
    "userId" UUID,

    CONSTRAINT "WomenadnSocilaInclusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThirdPartySexualAssault" (
    "id" UUID NOT NULL,
    "misconductId" UUID NOT NULL,
    "typeOfMisconduct" TEXT NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "descriptionOfWhatWasObserved" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reqId" UUID NOT NULL,
    "victimId" UUID,

    CONSTRAINT "ThirdPartySexualAssault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordPolicy" (
    "id" SERIAL NOT NULL,
    "minLength" INTEGER NOT NULL DEFAULT 12,
    "requireUppercase" BOOLEAN NOT NULL DEFAULT true,
    "requireLowercase" BOOLEAN NOT NULL DEFAULT true,
    "requireDigit" BOOLEAN NOT NULL DEFAULT true,
    "requireSpecialcharSymbol" BOOLEAN NOT NULL DEFAULT true,
    "expirationDays" INTEGER NOT NULL DEFAULT 90,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "dislikeCount" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "category" TEXT NOT NULL DEFAULT 'General',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementComment" (
    "id" UUID NOT NULL,
    "announcementId" UUID NOT NULL,
    "authorId" UUID,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementCommentReply" (
    "id" UUID NOT NULL,
    "commentId" UUID NOT NULL,
    "authorId" UUID,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementCommentReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" UUID NOT NULL,
    "settingKey" TEXT NOT NULL,
    "settingValue" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "trackingId" TEXT,
    "verificationSecret" TEXT,
    "reportingChannel" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "isFeedback" BOOLEAN NOT NULL DEFAULT false,
    "complainantName" TEXT,
    "complainantEmail" TEXT,
    "complainantPhone" TEXT,
    "complainantDepartment" TEXT,
    "complainantPosition" TEXT,
    "category" TEXT NOT NULL,
    "institution" TEXT,
    "departmentName" TEXT,
    "subject" TEXT,
    "perpetratorPosition" TEXT,
    "incidentDate" TIMESTAMP(3),
    "incidentLocation" TEXT,
    "description" TEXT NOT NULL,
    "complaintText" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'Low',
    "screeningNotes" TEXT,
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "duplicateReference" TEXT,
    "safetyRisk" TEXT DEFAULT 'None',
    "retaliationRisk" TEXT DEFAULT 'None',
    "confidentialityLevel" TEXT DEFAULT 'Standard',
    "documentsVerified" BOOLEAN NOT NULL DEFAULT false,
    "documentsRequired" TEXT,
    "assessmentNotes" TEXT,
    "jurisdictionCheck" BOOLEAN,
    "credibilityCheck" TEXT,
    "urgencyCheck" TEXT,
    "conflictCheck" BOOLEAN,
    "recommendedRoute" TEXT,
    "recommendedReferral" TEXT,
    "assessedById" UUID,
    "assessedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Submitted',
    "consentDeclaration" BOOLEAN NOT NULL DEFAULT false,
    "consentAccuracy" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "registeredAt" TIMESTAMP(3),
    "screenedAt" TIMESTAMP(3),
    "assignedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assigneeId" UUID,
    "createdBy" UUID,
    "screenedById" UUID,
    "departmentId" UUID,
    "anonymousToken" TEXT,
    "viewedAt" TIMESTAMP(3),
    "viewedById" UUID,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplaintMessage" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "senderId" UUID,
    "senderType" TEXT NOT NULL,
    "senderRole" TEXT,
    "message" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'COMPLAINANT_VISIBLE',
    "isSystemMessage" BOOLEAN NOT NULL DEFAULT false,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "editedAt" TIMESTAMP(3),

    CONSTRAINT "ComplaintMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplaintAttachment" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "messageId" TEXT,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "uploadedBy" UUID,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "securityScanStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ComplaintAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Petition" (
    "id" TEXT NOT NULL,
    "petitionNumber" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "reasonForDissatisfaction" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "additionalInfo" TEXT,
    "requestedAction" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Petition Submitted',
    "assignedOfficerId" UUID,
    "assignedById" UUID,
    "assignedAt" TIMESTAMP(3),
    "investigationInstructions" TEXT,
    "investigationDeadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Petition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartmentalResponse" (
    "id" TEXT NOT NULL,
    "responseNumber" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "investigationConducted" TEXT NOT NULL,
    "findings" TEXT NOT NULL,
    "actionsTaken" TEXT NOT NULL,
    "proposedActions" TEXT,
    "officialResponse" TEXT NOT NULL,
    "recommendations" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Response Submitted',
    "submittedById" UUID,
    "submittedAt" TIMESTAMP(3),
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "returnedForCorrection" BOOLEAN NOT NULL DEFAULT false,
    "returnReason" TEXT,
    "returnedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartmentalResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestigationReport" (
    "id" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "petitionId" TEXT NOT NULL,
    "background" TEXT NOT NULL,
    "objectives" TEXT NOT NULL,
    "activitiesPerformed" TEXT NOT NULL,
    "evidenceCollected" TEXT NOT NULL,
    "personsInterviewed" TEXT NOT NULL,
    "findings" TEXT NOT NULL,
    "observations" TEXT NOT NULL,
    "conclusions" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Investigation Report Submitted',
    "submittedById" UUID,
    "submittedAt" TIMESTAMP(3),
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "returnedForCorrection" BOOLEAN NOT NULL DEFAULT false,
    "returnReason" TEXT,
    "returnedAt" TIMESTAMP(3),
    "finalDecision" TEXT,
    "finalDecisionById" UUID,
    "finalDecisionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestigationReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetitionAttachment" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "departmentalResponseId" TEXT,
    "investigationReportId" TEXT,
    "uploadedBy" UUID,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PetitionAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investigation" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "assignedInvestigatorId" UUID,
    "assignedSupervisorId" UUID,
    "assignedById" UUID,
    "status" TEXT NOT NULL DEFAULT 'Assigned',
    "scope" TEXT,
    "objectives" TEXT,
    "investigationPlan" TEXT,
    "complaintDetails" TEXT,
    "evidenceDetails" TEXT,
    "evidenceDocuments" TEXT,
    "evidenceMessages" TEXT,
    "rootCause" TEXT,
    "responsibility" TEXT,
    "responsibilityOffice" TEXT,
    "responsibilityPerson" TEXT,
    "impact" TEXT,
    "correctiveAction" TEXT,
    "startDate" TIMESTAMP(3),
    "targetCompletionDate" TIMESTAMP(3),
    "actualCompletionDate" TIMESTAMP(3),
    "reportSubmittedAt" TIMESTAMP(3),
    "reportSubmittedById" UUID,
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "reviewDecision" TEXT,
    "findings" TEXT,
    "recommendation" TEXT,
    "decision" TEXT,
    "decisionAuthority" TEXT,
    "decisionById" UUID,
    "decisionDate" TIMESTAMP(3),
    "outcome" TEXT,
    "referralInstitution" TEXT,
    "referralDate" TIMESTAMP(3),
    "referralReason" TEXT,
    "referralApprovedById" UUID,
    "closureReason" TEXT,
    "followUpActions" TEXT,
    "closedById" UUID,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestigationActivity" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "activityDate" TIMESTAMP(3) NOT NULL,
    "conductedBy" UUID,
    "outcomes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestigationActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT,
    "investigationId" TEXT,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileHash" TEXT,
    "description" TEXT,
    "uploadedBy" UUID,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "custodyLog" TEXT,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "policyType" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "owner" TEXT,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "reviewDate" TIMESTAMP(3),
    "filePath" TEXT,
    "fileSize" INTEGER,
    "approvalAuthority" TEXT,
    "approvalDate" TIMESTAMP(3),
    "publicationDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "description" TEXT,
    "previousVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyAcknowledgment" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyAcknowledgment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Declaration" (
    "id" TEXT NOT NULL,
    "declarationNumber" TEXT NOT NULL,
    "declarantId" UUID NOT NULL,
    "department" TEXT,
    "declarationType" TEXT NOT NULL,
    "relatedOrganization" TEXT,
    "relationshipDescription" TEXT,
    "potentialImpact" TEXT,
    "dateDisclosed" TIMESTAMP(3) NOT NULL,
    "proposedMitigation" TEXT,
    "giftDescription" TEXT,
    "offeredBy" TEXT,
    "estimatedValue" DECIMAL(65,30),
    "currency" TEXT,
    "dateOffered" TIMESTAMP(3),
    "officialPurpose" TEXT,
    "acceptanceStatus" TEXT,
    "reviewerId" UUID,
    "reviewDate" TIMESTAMP(3),
    "decision" TEXT,
    "reviewComments" TEXT,
    "mitigationAction" TEXT,
    "mitigationDueDate" TIMESTAMP(3),
    "mitigationStatus" TEXT,
    "isRecusal" BOOLEAN NOT NULL DEFAULT false,
    "recusalReason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Declaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Training" (
    "id" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "learningObjectives" TEXT,
    "deliveryMethod" TEXT NOT NULL,
    "trainer" TEXT,
    "targetAudience" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "onlineLink" TEXT,
    "capacity" INTEGER,
    "materialsPath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Training_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingRegistration" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "attendanceDate" TIMESTAMP(3),
    "completionStatus" TEXT,
    "completionDate" TIMESTAMP(3),
    "evaluationScore" INTEGER,
    "evaluationComments" TEXT,

    CONSTRAINT "TrainingRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAssessment" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "process" TEXT NOT NULL,
    "riskDescription" TEXT NOT NULL,
    "riskCategory" TEXT NOT NULL,
    "causes" TEXT,
    "likelihood" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "inherentRisk" TEXT NOT NULL,
    "existingControls" TEXT,
    "mitigationActions" TEXT,
    "responsibleOfficer" TEXT,
    "dueDate" TIMESTAMP(3),
    "residualRisk" TEXT,
    "reviewDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MitigationPlan" (
    "id" TEXT NOT NULL,
    "riskAssessmentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "responsibleOfficer" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "progress" TEXT,
    "evidence" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MitigationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "fromId" UUID NOT NULL,
    "toId" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "readBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecretCode" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "codeHash" TEXT NOT NULL,
    "resetRequired" BOOLEAN NOT NULL DEFAULT false,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecretCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OvertimeRequest_reqId_idx" ON "OvertimeRequest"("reqId");

-- CreateIndex
CREATE INDEX "OvertimeRequest_departmentId_idx" ON "OvertimeRequest"("departmentId");

-- CreateIndex
CREATE INDEX "OvertimeNotification_userId_idx" ON "OvertimeNotification"("userId");

-- CreateIndex
CREATE INDEX "OvertimeNotification_overtimeRequestId_idx" ON "OvertimeNotification"("overtimeRequestId");

-- CreateIndex
CREATE INDEX "OvertimeNotification_departmentId_idx" ON "OvertimeNotification"("departmentId");

-- CreateIndex
CREATE INDEX "FieldNotification_userId_idx" ON "FieldNotification"("userId");

-- CreateIndex
CREATE INDEX "FieldNotification_fieldRequestId_idx" ON "FieldNotification"("fieldRequestId");

-- CreateIndex
CREATE INDEX "FieldNotification_departmentId_idx" ON "FieldNotification"("departmentId");

-- CreateIndex
CREATE INDEX "UserNotification_userId_idx" ON "UserNotification"("userId");

-- CreateIndex
CREATE INDEX "UserNotification_fieldRequestId_idx" ON "UserNotification"("fieldRequestId");

-- CreateIndex
CREATE INDEX "UserNotification_departmentId_idx" ON "UserNotification"("departmentId");

-- CreateIndex
CREATE INDEX "UserNotification_actionByUserId_idx" ON "UserNotification"("actionByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Module_name_key" ON "Module"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_action_key" ON "Permission"("action");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_moduleId_permissionId_key" ON "UserPermission"("userId", "moduleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE INDEX "Submission_recipientUserId_idx" ON "Submission"("recipientUserId");

-- CreateIndex
CREATE INDEX "Submission_departmentId_idx" ON "Submission"("departmentId");

-- CreateIndex
CREATE INDEX "FieldRequest_reqId_idx" ON "FieldRequest"("reqId");

-- CreateIndex
CREATE INDEX "FieldRequest_departmentId_idx" ON "FieldRequest"("departmentId");

-- CreateIndex
CREATE INDEX "DriverDetaile_userId_idx" ON "DriverDetaile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverDetaile_userId_empId_key" ON "DriverDetaile"("userId", "empId");

-- CreateIndex
CREATE INDEX "WomenadnSocilaInclusion_victimId_idx" ON "WomenadnSocilaInclusion"("victimId");

-- CreateIndex
CREATE INDEX "WomenadnSocilaInclusion_departmentId_idx" ON "WomenadnSocilaInclusion"("departmentId");

-- CreateIndex
CREATE INDEX "WomenadnSocilaInclusion_userId_idx" ON "WomenadnSocilaInclusion"("userId");

-- CreateIndex
CREATE INDEX "ThirdPartySexualAssault_misconductId_idx" ON "ThirdPartySexualAssault"("misconductId");

-- CreateIndex
CREATE INDEX "ThirdPartySexualAssault_reqId_idx" ON "ThirdPartySexualAssault"("reqId");

-- CreateIndex
CREATE INDEX "ThirdPartySexualAssault_victimId_idx" ON "ThirdPartySexualAssault"("victimId");

-- CreateIndex
CREATE INDEX "AnnouncementComment_announcementId_idx" ON "AnnouncementComment"("announcementId");

-- CreateIndex
CREATE INDEX "AnnouncementComment_authorId_idx" ON "AnnouncementComment"("authorId");

-- CreateIndex
CREATE INDEX "AnnouncementCommentReply_commentId_idx" ON "AnnouncementCommentReply"("commentId");

-- CreateIndex
CREATE INDEX "AnnouncementCommentReply_authorId_idx" ON "AnnouncementCommentReply"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_settingKey_key" ON "Setting"("settingKey");

-- CreateIndex
CREATE INDEX "Setting_category_idx" ON "Setting"("category");

-- CreateIndex
CREATE INDEX "Setting_settingKey_idx" ON "Setting"("settingKey");

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_referenceNumber_key" ON "Complaint"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_trackingId_key" ON "Complaint"("trackingId");

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_anonymousToken_key" ON "Complaint"("anonymousToken");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- CreateIndex
CREATE INDEX "Complaint_category_idx" ON "Complaint"("category");

-- CreateIndex
CREATE INDEX "Complaint_priority_idx" ON "Complaint"("priority");

-- CreateIndex
CREATE INDEX "Complaint_createdAt_idx" ON "Complaint"("createdAt");

-- CreateIndex
CREATE INDEX "Complaint_screenedById_idx" ON "Complaint"("screenedById");

-- CreateIndex
CREATE INDEX "Complaint_viewedAt_idx" ON "Complaint"("viewedAt");

-- CreateIndex
CREATE INDEX "ComplaintMessage_complaintId_idx" ON "ComplaintMessage"("complaintId");

-- CreateIndex
CREATE INDEX "ComplaintMessage_senderId_idx" ON "ComplaintMessage"("senderId");

-- CreateIndex
CREATE INDEX "ComplaintAttachment_complaintId_idx" ON "ComplaintAttachment"("complaintId");

-- CreateIndex
CREATE INDEX "ComplaintAttachment_messageId_idx" ON "ComplaintAttachment"("messageId");

-- CreateIndex
CREATE INDEX "ComplaintAttachment_uploadedBy_idx" ON "ComplaintAttachment"("uploadedBy");

-- CreateIndex
CREATE UNIQUE INDEX "Petition_petitionNumber_key" ON "Petition"("petitionNumber");

-- CreateIndex
CREATE INDEX "Petition_complaintId_idx" ON "Petition"("complaintId");

-- CreateIndex
CREATE INDEX "Petition_status_idx" ON "Petition"("status");

-- CreateIndex
CREATE INDEX "Petition_assignedOfficerId_idx" ON "Petition"("assignedOfficerId");

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentalResponse_responseNumber_key" ON "DepartmentalResponse"("responseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentalResponse_complaintId_key" ON "DepartmentalResponse"("complaintId");

-- CreateIndex
CREATE INDEX "DepartmentalResponse_complaintId_idx" ON "DepartmentalResponse"("complaintId");

-- CreateIndex
CREATE INDEX "DepartmentalResponse_status_idx" ON "DepartmentalResponse"("status");

-- CreateIndex
CREATE INDEX "DepartmentalResponse_submittedById_idx" ON "DepartmentalResponse"("submittedById");

-- CreateIndex
CREATE UNIQUE INDEX "InvestigationReport_reportNumber_key" ON "InvestigationReport"("reportNumber");

-- CreateIndex
CREATE UNIQUE INDEX "InvestigationReport_petitionId_key" ON "InvestigationReport"("petitionId");

-- CreateIndex
CREATE INDEX "InvestigationReport_petitionId_idx" ON "InvestigationReport"("petitionId");

-- CreateIndex
CREATE INDEX "InvestigationReport_status_idx" ON "InvestigationReport"("status");

-- CreateIndex
CREATE INDEX "InvestigationReport_submittedById_idx" ON "InvestigationReport"("submittedById");

-- CreateIndex
CREATE UNIQUE INDEX "Investigation_caseNumber_key" ON "Investigation"("caseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Investigation_complaintId_key" ON "Investigation"("complaintId");

-- CreateIndex
CREATE INDEX "Investigation_status_idx" ON "Investigation"("status");

-- CreateIndex
CREATE INDEX "Investigation_startDate_idx" ON "Investigation"("startDate");

-- CreateIndex
CREATE INDEX "Investigation_targetCompletionDate_idx" ON "Investigation"("targetCompletionDate");

-- CreateIndex
CREATE INDEX "InvestigationActivity_investigationId_idx" ON "InvestigationActivity"("investigationId");

-- CreateIndex
CREATE INDEX "InvestigationActivity_activityDate_idx" ON "InvestigationActivity"("activityDate");

-- CreateIndex
CREATE INDEX "Evidence_complaintId_idx" ON "Evidence"("complaintId");

-- CreateIndex
CREATE INDEX "Evidence_investigationId_idx" ON "Evidence"("investigationId");

-- CreateIndex
CREATE INDEX "Evidence_uploadedAt_idx" ON "Evidence"("uploadedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_documentNumber_key" ON "Policy"("documentNumber");

-- CreateIndex
CREATE INDEX "Policy_status_idx" ON "Policy"("status");

-- CreateIndex
CREATE INDEX "Policy_policyType_idx" ON "Policy"("policyType");

-- CreateIndex
CREATE INDEX "Policy_effectiveDate_idx" ON "Policy"("effectiveDate");

-- CreateIndex
CREATE INDEX "PolicyAcknowledgment_policyId_idx" ON "PolicyAcknowledgment"("policyId");

-- CreateIndex
CREATE INDEX "PolicyAcknowledgment_userId_idx" ON "PolicyAcknowledgment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyAcknowledgment_policyId_userId_key" ON "PolicyAcknowledgment"("policyId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Declaration_declarationNumber_key" ON "Declaration"("declarationNumber");

-- CreateIndex
CREATE INDEX "Declaration_declarantId_idx" ON "Declaration"("declarantId");

-- CreateIndex
CREATE INDEX "Declaration_declarationType_idx" ON "Declaration"("declarationType");

-- CreateIndex
CREATE INDEX "Declaration_status_idx" ON "Declaration"("status");

-- CreateIndex
CREATE INDEX "Declaration_submittedAt_idx" ON "Declaration"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Training_courseCode_key" ON "Training"("courseCode");

-- CreateIndex
CREATE INDEX "Training_status_idx" ON "Training"("status");

-- CreateIndex
CREATE INDEX "Training_startDate_idx" ON "Training"("startDate");

-- CreateIndex
CREATE INDEX "TrainingRegistration_trainingId_idx" ON "TrainingRegistration"("trainingId");

-- CreateIndex
CREATE INDEX "TrainingRegistration_userId_idx" ON "TrainingRegistration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingRegistration_trainingId_userId_key" ON "TrainingRegistration"("trainingId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskAssessment_riskId_key" ON "RiskAssessment"("riskId");

-- CreateIndex
CREATE INDEX "RiskAssessment_institution_idx" ON "RiskAssessment"("institution");

-- CreateIndex
CREATE INDEX "RiskAssessment_department_idx" ON "RiskAssessment"("department");

-- CreateIndex
CREATE INDEX "RiskAssessment_status_idx" ON "RiskAssessment"("status");

-- CreateIndex
CREATE INDEX "RiskAssessment_inherentRisk_idx" ON "RiskAssessment"("inherentRisk");

-- CreateIndex
CREATE INDEX "MitigationPlan_riskAssessmentId_idx" ON "MitigationPlan"("riskAssessmentId");

-- CreateIndex
CREATE INDEX "MitigationPlan_dueDate_idx" ON "MitigationPlan"("dueDate");

-- CreateIndex
CREATE INDEX "MitigationPlan_status_idx" ON "MitigationPlan"("status");

-- CreateIndex
CREATE INDEX "Message_fromId_idx" ON "Message"("fromId");

-- CreateIndex
CREATE INDEX "Message_toId_idx" ON "Message"("toId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "SecretCode_userId_idx" ON "SecretCode"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SecretCode_userId_key" ON "SecretCode"("userId");

-- AddForeignKey
ALTER TABLE "FuelRequest" ADD CONSTRAINT "FuelRequest_requestorId_fkey" FOREIGN KEY ("requestorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OvertimeRequest" ADD CONSTRAINT "OvertimeRequest_reqId_fkey" FOREIGN KEY ("reqId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OvertimeRequest" ADD CONSTRAINT "OvertimeRequest_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OvertimeNotification" ADD CONSTRAINT "OvertimeNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OvertimeNotification" ADD CONSTRAINT "OvertimeNotification_overtimeRequestId_fkey" FOREIGN KEY ("overtimeRequestId") REFERENCES "OvertimeRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OvertimeNotification" ADD CONSTRAINT "OvertimeNotification_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldNotification" ADD CONSTRAINT "FieldNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldNotification" ADD CONSTRAINT "FieldNotification_fieldRequestId_fkey" FOREIGN KEY ("fieldRequestId") REFERENCES "FieldRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldNotification" ADD CONSTRAINT "FieldNotification_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_actionByUserId_fkey" FOREIGN KEY ("actionByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_fieldRequestId_fkey" FOREIGN KEY ("fieldRequestId") REFERENCES "FieldRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_headId_fkey" FOREIGN KEY ("headId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionAttachment" ADD CONSTRAINT "SubmissionAttachment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldRequest" ADD CONSTRAINT "FieldRequest_reqId_fkey" FOREIGN KEY ("reqId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldRequest" ADD CONSTRAINT "FieldRequest_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverDetaile" ADD CONSTRAINT "DriverDetaile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WomenadnSocilaInclusion" ADD CONSTRAINT "WomenadnSocilaInclusion_victimId_fkey" FOREIGN KEY ("victimId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WomenadnSocilaInclusion" ADD CONSTRAINT "WomenadnSocilaInclusion_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WomenadnSocilaInclusion" ADD CONSTRAINT "WomenadnSocilaInclusion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartySexualAssault" ADD CONSTRAINT "ThirdPartySexualAssault_misconductId_fkey" FOREIGN KEY ("misconductId") REFERENCES "WomenadnSocilaInclusion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartySexualAssault" ADD CONSTRAINT "ThirdPartySexualAssault_reqId_fkey" FOREIGN KEY ("reqId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartySexualAssault" ADD CONSTRAINT "ThirdPartySexualAssault_victimId_fkey" FOREIGN KEY ("victimId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementComment" ADD CONSTRAINT "AnnouncementComment_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementComment" ADD CONSTRAINT "AnnouncementComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementCommentReply" ADD CONSTRAINT "AnnouncementCommentReply_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "AnnouncementComment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementCommentReply" ADD CONSTRAINT "AnnouncementCommentReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_assessedById_fkey" FOREIGN KEY ("assessedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_screenedById_fkey" FOREIGN KEY ("screenedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_viewedById_fkey" FOREIGN KEY ("viewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintMessage" ADD CONSTRAINT "ComplaintMessage_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintMessage" ADD CONSTRAINT "ComplaintMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintAttachment" ADD CONSTRAINT "ComplaintAttachment_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintAttachment" ADD CONSTRAINT "ComplaintAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ComplaintMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintAttachment" ADD CONSTRAINT "ComplaintAttachment_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Petition" ADD CONSTRAINT "Petition_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Petition" ADD CONSTRAINT "Petition_assignedOfficerId_fkey" FOREIGN KEY ("assignedOfficerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Petition" ADD CONSTRAINT "Petition_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentalResponse" ADD CONSTRAINT "DepartmentalResponse_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentalResponse" ADD CONSTRAINT "DepartmentalResponse_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentalResponse" ADD CONSTRAINT "DepartmentalResponse_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationReport" ADD CONSTRAINT "InvestigationReport_petitionId_fkey" FOREIGN KEY ("petitionId") REFERENCES "Petition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationReport" ADD CONSTRAINT "InvestigationReport_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationReport" ADD CONSTRAINT "InvestigationReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationReport" ADD CONSTRAINT "InvestigationReport_finalDecisionById_fkey" FOREIGN KEY ("finalDecisionById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetitionAttachment" ADD CONSTRAINT "PetitionAttachment_departmentalResponseId_fkey" FOREIGN KEY ("departmentalResponseId") REFERENCES "DepartmentalResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetitionAttachment" ADD CONSTRAINT "PetitionAttachment_investigationReportId_fkey" FOREIGN KEY ("investigationReportId") REFERENCES "InvestigationReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_assignedInvestigatorId_fkey" FOREIGN KEY ("assignedInvestigatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_assignedSupervisorId_fkey" FOREIGN KEY ("assignedSupervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_decisionById_fkey" FOREIGN KEY ("decisionById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_referralApprovedById_fkey" FOREIGN KEY ("referralApprovedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationActivity" ADD CONSTRAINT "InvestigationActivity_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationActivity" ADD CONSTRAINT "InvestigationActivity_conductedBy_fkey" FOREIGN KEY ("conductedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_previousVersionId_fkey" FOREIGN KEY ("previousVersionId") REFERENCES "Policy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyAcknowledgment" ADD CONSTRAINT "PolicyAcknowledgment_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyAcknowledgment" ADD CONSTRAINT "PolicyAcknowledgment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Declaration" ADD CONSTRAINT "Declaration_declarantId_fkey" FOREIGN KEY ("declarantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Declaration" ADD CONSTRAINT "Declaration_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingRegistration" ADD CONSTRAINT "TrainingRegistration_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingRegistration" ADD CONSTRAINT "TrainingRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MitigationPlan" ADD CONSTRAINT "MitigationPlan_riskAssessmentId_fkey" FOREIGN KEY ("riskAssessmentId") REFERENCES "RiskAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_toId_fkey" FOREIGN KEY ("toId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretCode" ADD CONSTRAINT "SecretCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
