export type ComplaintCategory =
  | "staff_misconduct"
  | "abuse_of_authority"
  | "workplace_harassment"
  | "administrative_delay"
  | "policy_violation"
  | "fraud_corruption"
  | "facilities_environment"
  | "other";

export type ComplaintStatus = "new" | "in_review" | "resolved" | "escalated";

export interface Complaint {
  id: string; // internal id
  ref: string; // reference number shown to user

  // identification
  fullName?: string;
  employeeId?: string;
  position?: string;
  officeOrDepartment?: string;
  roleDeclared: "EMPLOYEE" | "DEPARTMENT_HEAD" | "GENERAL_DIRECTOR";

  // classification
  category: ComplaintCategory;
  categoryOtherText?: string;

  // details
  subject: string;
  incidentAt?: string;
  location?: string;
  personsInvolved?: string;
  description: string;
  impact?: string;
  desiredAction?: string;
  attachments?: string[];

  // privacy
  confidential: boolean;
  anonymous: boolean;
  declaration: boolean; // truthfulness
  consent: boolean; // privacy act consent

  // workflow/meta
  status: ComplaintStatus;
  department?: string;
  assignedTo?: string;
  createdBySub?: string; // token sub
  createdByRoles?: string[]; // roles at submission time
  createdAt: string;
  updatedAt: string;
}
