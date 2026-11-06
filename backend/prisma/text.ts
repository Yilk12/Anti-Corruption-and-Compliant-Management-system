//  // This is your Prisma schema file,
// // learn more about it in the docs: https://pris.ly/d/prisma-schema

// // Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// // Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

// generator client {
//   provider = "prisma-client-js"
// }

// datasource db {
//   provider = "postgresql"
//   url      = env("DATABASE_URL")
// }

// // ====================================================================
// // CORE ENUMS
// // ====================================================================

// enum UserRole {
//   ADMIN
//   SUPPORT_AGENT
//   Department_Head
//   Commissioner
//   END_USER
//   Driver
//   Maintenace_Team
//   Finance_Department
//   Announcement_Creator
//   Fllet_Manager
// }

// enum UserType {
//   INTERNAL
//   EXTERNAL
// }


// enum TicketStatus {
//   OPEN
//   IN_PROGRESS
//   RESOLVED
//   CLOSED
//   PENDING
// }

// enum TicketPriority {
//   URGENT
//   HIGH
//   MEDIUM
//   LOW
// }

// enum TicketCategory {
//   GENERAL
//   IT
//   HR
//   FINANCE
//   INCIDENT
// }

// // Submissions module enums
// enum SubmissionType {
//   COMPLAINT
//   SUGGESTION
//   REQUEST
//   INCIDENT
// }

// enum SubmissionStatus {
//   SUBMITTED
//   ACCEPTED
//   REJECTED
//   ESCALATED
//   MORE_INFO_REQUESTED
//   CLOSED
// }

// // Knowledge Base enums
// enum ArticleStatus {
//   DRAFT
//   REVIEW
//   PUBLISHED
//   ARCHIVED
// }
// enum Language {
//   EN
//   AM
//   OR
//   TI
//   SO
//   SI
//   WO
// }


// // Abuse Reports enums
// enum ReportStatus {
//   PENDING
//   RESOLVED
//   REJECTED
// }

// enum ReportTargetType {
//   USER
//   ARTICLE
//   TICKET
//   POST
//   COMMENT
// }

// enum ScheduleStatus {
//   ACTIVE
//   CANCELLED
//   COMPLETED
//   FAILED
// }

// enum ReportFrequency {
//   DAILY
//   WEEKLY
//   MONTHLY
// }

// // ====================================================================
// // CORE MODELS
// // ====================================================================

// // ====================================================================
// // USER MODEL
// // ====================================================================

// model User {
//   id                 String   @id @default(uuid()) @db.Uuid
//   email              String   @unique
//   firstName          String
//   lastName           String
//   password           String
//   phone              String?
//   role               UserRole
//   userType           UserType
//   department         String?
//   isActive           Boolean  @default(true)
//   createdAt          DateTime @default(now())
//   updatedAt          DateTime @updatedAt

//   // Relations
//   createdTickets      Ticket[]           @relation("CreatedTickets")
//   assignedTickets     Ticket[]           @relation("AssignedTickets")
//   comments            TicketComment[]
//   auditLogs           AuditLog[]
//   planAssignmentsFrom PlanAssignment[]   @relation("PlanFromUser")
//   planAssignmentsTo   PlanAssignment[]   @relation("PlanToUser")
//   planHistories       PlanHistory[]      @relation("PlanHistoryByUser")
//   submissions         Submission[]       @relation("SubmissionUser")
//   gmReviews           Submission[]       @relation("SubmissionGMReviewer")
//   fleetRequests       FleetRequest[]     // requestor -> FleetRequest
//   drivenTrips         Trip[]             // driver -> Trip
//   createdArticles     Article[]          // author -> Article
//   articleComments     ArticleComment[]   // author -> ArticleComment
//   articleFeedbacks    ArticleFeedback[]  // user -> ArticleFeedback
//   reportedAbuses      AbuseReport[]      @relation("ReportedBy")
//   reportsGenerated    Report[]           @relation("ReportsGeneratedByUser")
//   reportSchedules     ReportSchedule[]   @relation("ReportSchedulesByUser")

//   // Permissions
//   userPermissions     UserPermission[]
// }

// // ====================================================================
// // MODULE & PERMISSION
// // ====================================================================

// model Module {
//   id               Int               @id @default(autoincrement())
//   name             String            @unique
//   userPermissions  UserPermission[]
// }

// model Permission {
//   id     Int     @id @default(autoincrement())
//   action String  @unique
// }

// // ====================================================================
// // USER PERMISSIONS (JOIN TABLE)
// // ====================================================================

// model UserPermission {
//   id            Int      @id @default(autoincrement())
//   userId        String
//   moduleId      Int
//   permissionIds Int[]    // PostgreSQL array of permission IDs
//   createdAt     DateTime @default(now())
//   updatedAt     DateTime @updatedAt

//   // Relations
//   user   User   @relation(fields: [userId], references: [id])
//   module Module @relation(fields: [moduleId], references: [id])

//   @@unique([userId, moduleId]) // one row per module per user
// }



// model Department {
//   id          String       @id @default(uuid()) @db.Uuid
//   name        String
//   nameAm      String?
//   description String?
//   isActive    Boolean      @default(true)
//   createdAt   DateTime     @default(now())
//   updatedAt   DateTime     @updatedAt

//   tickets     Ticket[]
//   submissions Submission[]
// }

// model Ticket {
//   id            String       @id @default(uuid()) @db.Uuid
//   title         String
//   description   String
//   status        TicketStatus @default(OPEN)
//   priority      TicketPriority
//   category      TicketCategory
//   createdById   String       @db.Uuid       // <-- must match User.id
//   assigneeId    String?      @db.Uuid       // <-- optional UUID
//   departmentId  String?      @db.Uuid       // <-- optional UUID
//   slaDeadline   DateTime?
//   resolvedAt    DateTime?
//   createdAt     DateTime     @default(now())
//   updatedAt     DateTime     @updatedAt

//   // Relations
//   creator       User         @relation("CreatedTickets", fields: [createdById], references: [id])
//   assignee      User?        @relation("AssignedTickets", fields: [assigneeId], references: [id])
//   department    Department?  @relation(fields: [departmentId], references: [id])
//   comments      TicketComment[]
//   attachments   TicketAttachment[]
//   auditLogs     AuditLog[]
// }


// model Category {
//   id          String     @id @default(uuid()) @db.Uuid
//   name        String     @unique
//   isActive    Boolean    @default(true)
//   parentId    String?
//   createdAt   DateTime   @default(now())
//   updatedAt   DateTime   @updatedAt

//   parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
//   children    Category[] @relation("CategoryHierarchy")
//   articles    Article[]
// }

// model TicketComment {
//   id          String   @id @default(uuid()) @db.Uuid
//   ticketId    String
//   authorId    String
//   content     String
//   createdAt   DateTime @default(now())

//   ticket      Ticket @relation(fields: [ticketId], references: [id])
//   author      User   @relation(fields: [authorId], references: [id])
// }

// model TicketAttachment {
//   id          String   @id @default(uuid()) @db.Uuid
//   ticketId    String
//   filename    String
//   filepath    String
//   mimetype    String
//   size        Int
//   createdAt   DateTime @default(now())

//   ticket      Ticket @relation(fields: [ticketId], references: [id])
// }

// model AuditLog {
//   id          String   @id @default(uuid()) @db.Uuid
//   action      String
//   entity      String
//   entityId    String
//   userId      String
//   ticketId    String?
//   oldValues   Json?
//   newValues   Json?
//   createdAt   DateTime @default(now())

//   user        User     @relation(fields: [userId], references: [id])
//   ticket      Ticket?  @relation(fields: [ticketId], references: [id])
// }

// model PlanAssignment {
//   id          String   @id @default(uuid()) @db.Uuid
//   planId      String
//   fromUserId  String
//   toUserId    String
//   level       String
//   notes       String?
//   dueDate     DateTime?
//   createdAt   DateTime @default(now())

//   fromUser    User     @relation("PlanFromUser", fields: [fromUserId], references: [id])
//   toUser      User     @relation("PlanToUser", fields: [toUserId], references: [id])
// }

// model PlanHistory {
//   id          String   @id @default(uuid()) @db.Uuid
//   planId      String
//   byUserId    String
//   action      String
//   comments    String?
//   createdAt   DateTime @default(now())

//   byUser      User     @relation("PlanHistoryByUser", fields: [byUserId], references: [id])
// }

// // ====================================================================
// // KNOWLEDGE BASE MODELS
// // ====================================================================

// model Article {
//   id             String          @id @default(uuid()) @db.Uuid
//   title          String
//   titleAm        String?
//   content        String
//   contentAm      String?
//   excerpt        String?
//   status         ArticleStatus   @default(DRAFT)
//   language       Language
//   viewCount      Int             @default(0)
//   likeCount      Int             @default(0)
//   dislikeCount   Int             @default(0)
//   authorId       String
//   categoryId     String?
//   publishedAt    DateTime?
//   expiresAt      DateTime?
//   createdAt      DateTime        @default(now())
//   updatedAt      DateTime        @updatedAt

//   author         User            @relation(fields: [authorId], references: [id])
//   category       Category?       @relation(fields: [categoryId], references: [id])
//   tags           ArticleTag[]
//   comments       ArticleComment[]
//   attachments    ArticleAttachment[]
//   feedback       ArticleFeedback[]
// }

// model Tag {
//   id          String     @id @default(uuid()) @db.Uuid
//   name        String     @unique
//   createdAt   DateTime @default(now())
//   updatedAt   DateTime @updatedAt

//   articleTags ArticleTag[]
// }

// model ArticleTag {
//   articleId String
//   tagId     String

//   article Article @relation(fields: [articleId], references: [id])
//   tag     Tag     @relation(fields: [tagId], references: [id])

//   @@id([articleId, tagId])
// }

// model ArticleAttachment {
//   id          String   @id @default(uuid()) @db.Uuid
//   articleId   String
//   filename    String
//   filepath    String
//   mimetype    String
//   size        Int
//   createdAt   DateTime @default(now())

//   article     Article @relation(fields: [articleId], references: [id])
// }

// model ArticleComment {
//   id          String   @id @default(uuid()) @db.Uuid
//   articleId   String
//   authorId    String
//   content     String
//   createdAt   DateTime @default(now())

//   article     Article @relation(fields: [articleId], references: [id])
//   author      User    @relation(fields: [authorId], references: [id])
// }

// model ArticleFeedback {
//   id          String   @id @default(uuid()) @db.Uuid
//   articleId   String
//   userId      String
//   isLike      Boolean
//   createdAt   DateTime @default(now())

//   article     Article @relation(fields: [articleId], references: [id])
//   user        User    @relation(fields: [userId], references: [id])
// }

// // ====================================================================
// // SUBMISSIONS & REPORTS MODELS
// // ====================================================================

// model Submission {
//   id                  String             @id @default(uuid()) @db.Uuid
//   userId              String?
//   submitterName       String?
//   submitterDepartment String?
//   contactEmail        String?
//   contactPhone        String?
//   anonymous           Boolean            @default(false)
//   type                SubmissionType
//   subject             String
//   description         String
//   status              SubmissionStatus   @default(SUBMITTED)
//   decisionSummary     String?
//   decisionAt          DateTime?
//   gmReviewerId        String?
//   assignedDepartmentId String?
//   escalatedTo         String?
//   createdAt           DateTime           @default(now())
//   updatedAt           DateTime           @updatedAt

//   user                User?              @relation("SubmissionUser", fields: [userId], references: [id])
//   gmReviewer          User?              @relation("SubmissionGMReviewer", fields: [gmReviewerId], references: [id])
//   assignedDepartment  Department?        @relation(fields: [assignedDepartmentId], references: [id])
// }

// model AbuseReport {
//   id          String             @id @default(uuid()) @db.Uuid
//   reporterId  String
//   targetType  ReportTargetType
//   targetId    String
//   reason      String
//   description String?
//   status      ReportStatus       @default(PENDING)
//   createdAt   DateTime           @default(now())

//   // FIX APPLIED HERE: Explicitly named the relation
//   reporter    User               @relation("ReportedBy", fields: [reporterId], references: [id])

//   @@unique([targetType, targetId, status], map: "uniq_open_report_per_target")
// }

// model Report {
//   id            String   @id @default(uuid()) @db.Uuid
//   type          String
//   format        String
//   data          Json?
//   filename      String?
//   mimeType      String?
//   generatedById String
//   createdAt     DateTime @default(now())
  
//   generatedBy   User     @relation("ReportsGeneratedByUser", fields: [generatedById], references: [id])
// }

// model ReportSchedule {
//   id            String         @id @default(uuid()) @db.Uuid
//   reportType    String
//   config        Json?
//   frequency     ReportFrequency
//   recipients    String[]
//   scheduledById String
//   nextRun       DateTime
//   status        ScheduleStatus @default(ACTIVE)
//   createdAt     DateTime       @default(now())
//   updatedAt     DateTime       @updatedAt
  
//   scheduledBy   User           @relation("ReportSchedulesByUser", fields: [scheduledById], references: [id])
// }

// // ====================================================================
// // FLEET MODULE MODELS
// // ====================================================================

// model Vehicle {
//   id           String   @id @default(uuid()) @db.Uuid
//   plate        String   @unique
//   make         String?
//   model        String?
//   year         Int?
//   departmentId String?
//   createdAt    DateTime @default(now())

//   trips        Trip[]
// }

// model FleetRequest {
//   id          Int      @id @default(autoincrement())
//   requestorId String
//   purpose     String
//   tripType    String?
//   destination String?
//   date        DateTime
//   status      String   @default("PENDING")
//   createdAt   DateTime @default(now())

//   requestor   User?    @relation(fields: [requestorId], references: [id])
// }

// model Trip {
//   id          String   @id @default(uuid()) @db.Uuid
//   vehicleId   String
//   driverId    String
//   startAt     DateTime
//   origin      String?
//   destination String?
//   distanceKm  Float?
//   createdAt   DateTime @default(now())

//   vehicle     Vehicle  @relation(fields: [vehicleId], references: [id])
//   driver      User     @relation(fields: [driverId], references: [id])
// }

// // ====================================================================
// // SYSTEM SETTINGS MODEL
// // ====================================================================

// /**
//  * @description Centralized key/value store for application configuration.
//  */
// model SystemSetting {
//   id          Int      @id @default(autoincrement())
//   key         String   @unique  // e.g., 'SLA_DEFAULT_DAYS', 'MAX_FILE_UPLOAD_SIZE'
//   value       String   // The setting value, stored as a string (e.g., '3', '50MB')
//   description String?
//   createdAt   DateTime @default(now())
//   updatedAt   DateTime @updatedAt
// }