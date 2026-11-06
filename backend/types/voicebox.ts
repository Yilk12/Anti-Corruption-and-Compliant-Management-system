export type FeedbackType = "complaint" | "suggestion" | "compliment";
export type IdentityType = "internal" | "external";
export type VoiceboxStatus = "submitted" | "in_progress" | "resolved" | "escalated";

export interface VoiceboxEntry {
  id: string;
  feedbackType: FeedbackType;
  identityType: IdentityType;
  anonymous: boolean;
  subject: string;
  description: string;
  incidentAt?: string;
  location?: string;
  staffInvolved?: string;
  attachments?: string[];
  desiredAction?: string;
  receiver?: 'user' | 'department_head' | 'commissioner';

  // submitter info
  submitterId?: string; // token sub
  fullName?: string;
  contact?: string;
  officeOrUnit?: string;
  address?: string;

  // workflow
  status: VoiceboxStatus;
  department?: string;
  assignedTo?: string;
  priority?: "normal" | "high";
  createdByRole?: string; // e.g., GENERAL_DIRECTOR, DEPARTMENT_HEAD, EMPLOYEE

  createdAt: string;
  updatedAt: string;
}
