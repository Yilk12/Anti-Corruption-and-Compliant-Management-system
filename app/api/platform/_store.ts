// In-memory platform-wide store for multiple modules
export type ModuleKey =
  | 'tickets'
  | 'knowledge_base'
  | 'complaints'
  | 'users'
  | 'feedback'
  | 'analytics'
  | 'messages'

export type ItemRecord = { id: string; [key: string]: any }

// Daily Task Records
export type DailyTask = {
  title: string;
  description?: string;
  startTime?: string; // HH:MM
  endTime?: string;   // HH:MM
  totalMinutes?: number; // auto or manual
  priority?: 'High'|'Medium'|'Low';
  status?: 'Completed'|'In Progress'|'Blocked';
  remarks?: string;
}

export type DailyTaskRecord = {
  id: string;
  date: string; // yyyy-mm-dd
  employeeName: string;
  department?: string;
  team?: string;
  supervisorName?: string;
  tasks: DailyTask[];
  totalMinutes?: number;
  challenges?: string;
  suggestions?: string;
  submittedTo?: string; // manager/supervisor id or email
  signature?: string;   // optional text signature
  submittedBy: string;  // user id/email
  createdAt: string;
}

export const DAILY_TASK_RECORDS: DailyTaskRecord[] = [];

// General Reports (aggregated across periods)
export type GeneralReport = {
  id: string;
  periodType: 'Daily'|'Weekly'|'Monthly'|'Custom'|'All';
  periodStart?: string; // yyyy-mm-dd
  periodEnd?: string;   // yyyy-mm-dd
  submittedBy: string;
  submittedTo?: string;
  title?: string;
  notes?: string;
  stats: {
    totalMinutes: number;
    totalTasks: number;
    completed: number;
    inProgress: number;
    blocked: number;
  };
  createdAt: string;
};

export const GENERAL_REPORTS: GeneralReport[] = [];

// Field & Overtime Requests
export type ApprovalStatus = 'DRAFT'|'PENDING_DEPT'|'PENDING_HRM'|'APPROVED'|'REJECTED';

export type ApprovalStep = {
  by?: string; // reviewer id
  at?: string; // ISO timestamp
  action?: 'SUBMIT'|'APPROVE'|'REJECT'|'FORWARD';
  comments?: string;
};

export type BaseRequestCommon = {
  id: string;
  requesterId: string; // user id/email
  requesterName?: string;
  department?: string;
  departmentHeadId?: string; // reviewer at dept stage
  requestType: 'OVERTIME'|'FIELD';
  purposeType?: string;
  justification?: string;
  attachmentUrls?: Array<{ url: string; name?: string; size?: number; type?: string }>;
  status: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
  history: ApprovalStep[];
};

export type OvertimeRequest = BaseRequestCommon & {
  overtimeType: 'Extra Time'|'Weekend';
  dates: string[]; // yyyy-mm-dd
  startTime?: string; // HH:MM
  endTime?: string;   // HH:MM
  durationType?: 'Half Time'|'Full Day';
};

export type FieldRequest = BaseRequestCommon & {
  location: 'In Addis Ababa'|'Out of Addis Ababa';
  fromDate: string; // yyyy-mm-dd
  toDate: string;   // yyyy-mm-dd
  numberOfDays: number; // auto-calculated
  startTime?: string; // optional HH:MM
  endTime?: string;   // optional HH:MM
  totalTime?: string; // optional, e.g., "6h 00m"
  durationType?: 'Half Day'|'Full Day';
  remarks?: string;
};

export const OVERTIME_REQUESTS: OvertimeRequest[] = [];
export const FIELD_REQUESTS: FieldRequest[] = [];

export function nextOvertimeId(): string {
  const n = OVERTIME_REQUESTS.length + 1;
  return `OT-${String(n).padStart(3,'0')}`;
}

export function nextFieldId(): string {
  const n = FIELD_REQUESTS.length + 1;
  return `FLD-${String(n).padStart(3,'0')}`;
}
// Friends, Blocks, Groups (separate stores)
export const FRIENDS: Array<{ id: string; a: string; b: string; createdAt: string }> = [
  { id: 'FR-001', a: 'U-002', b: 'U-003', createdAt: new Date().toISOString() },
]

export const BLOCKS: Array<{ id: string; blocker: string; blocked: string; createdAt: string }> = [
]

export type GroupMember = { userId: string; role: 'owner' | 'admin' | 'member' }
export const GROUPS: Array<{ id: string; name: string; members: GroupMember[]; createdAt: string }> = [
  { id: 'GRP-001', name: 'Operations Team', members: [
    { userId: 'U-002', role: 'owner' },
    { userId: 'U-003', role: 'member' },
    { userId: 'U-004', role: 'member' },
  ], createdAt: new Date().toISOString() },
]

export const PLATFORM_STORE: Record<ModuleKey, ItemRecord[]> = {
  tickets: [
    { id: 'T-001', title: 'Printer not working', status: 'open', priority: 'medium' },
  ],
  knowledge_base: [
    { id: 'K-001', title: 'How to reset password', category: 'accounts' },
  ],
  complaints: [
    { id: 'C-001', subject: 'Noise issue', status: 'new' },
  ],
  users: [
    { id: 'U-001', name: 'Admin', email: 'admin@example.com', role: 'ADMIN' },
    { id: 'U-002', name: 'Alice Staff', email: 'alice.staff@example.com', role: 'STAFF', department: 'Operations', team: 'Ops-A' },
    { id: 'U-003', name: 'Tom Team Lead', email: 'tom.tl@example.com', role: 'TEAM_LEAD', department: 'Operations', team: 'Ops-A' },
    { id: 'U-004', name: 'Dina Dept Head', email: 'dina.dh@example.com', role: 'DEPARTMENT_HEAD', department: 'Operations' },
    { id: 'U-007', name: 'Mati Staff', email: 'mati.staff@example.com', role: 'STAFF', department: 'Operations', team: 'Ops-B' },
    { id: 'U-008', name: 'Liya Team Lead', email: 'liya.tl@example.com', role: 'TEAM_LEAD', department: 'Operations', team: 'Ops-B' },
  ],
  feedback: [
    { id: 'FB-001', message: 'Great service', rating: 5 },
  ],
  analytics: [
    { id: 'AN-001', metric: 'active_users', value: 120 },
  ],
  messages: [
    { id: 'MSG-001', from: 'U-002', to: 'U-003', text: 'Hello Team Lead, I have submitted the plan.', createdAt: new Date().toISOString(), attachments: [], readBy: [] },
    { id: 'MSG-002', from: 'U-003', to: 'U-002', text: 'Received. I will review it.', createdAt: new Date().toISOString(), attachments: [], readBy: [] },
  ],
}

export function nextId(module: ModuleKey): string {
  const prefix: Record<ModuleKey, string> = {
    tickets: 'T', knowledge_base: 'K', complaints: 'C', users: 'U', feedback: 'FB', analytics: 'AN', messages: 'MSG'
  }
  const arr = PLATFORM_STORE[module]
  const n = arr.length + 1
  const p = prefix[module]
  const pad = 3
  return `${p}-${String(n).padStart(pad, '0')}`
}
