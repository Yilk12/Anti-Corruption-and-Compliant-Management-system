// auth.ts
export type DecodedJwt = {
  sub?: string;
  id?: string;
  userId?: string;
  role?: string | string[];
  roles?: string[] | { name?: string }[];
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
  [key: string]: any;
};

// Frontend normalized user roles
export type UserRole =
  | "employee"
  | "department_head"
  | "manager"
  | "commissioner"
  | "admin"
  | "ads_admin"
  | "ads_editor"
  | "ads_viewer"
  | "driver"
  | "maintenance_team"
  | "women_social_inclusion"
  | "feedback_complaint_manager"
  | "feedback_complaint_officer"
  | "ethics_anti_corruption"
  | "ethics_officer"
  | "administrative_complaints_team"
  | "it_officer"
  | "vehicle_inspector"
  | "asset_manager"
  | "asset_officer"
  | "asset_control_registration_officer";

// Backend roles enum
export enum BackendUserRole {
  ADMIN = "ADMIN",
  Department_Head = "Department_Head",
  Commissioner = "Commissioner",
  END_USER = "END_USER",
  Driver = "Driver",
  Maintenance_Team = "Maintenance_Team",
  // Some databases/tokens may contain a misspelling; support both just in case
  Maintenace_Team = "Maintenace_Team",
  Announcement_Creator = "Announcement_Creator",
   Women_Social_Inclusion = "Women_Social_Inclusion",
   Feedback_Complaint_Manager = "Feedback_Complaint_Manager",
   Feedback_Complaint_Officer = "Feedback_Complaint_Officer",
   Ethics_Anti_Corruption = "Ethics_Anti_Corruption",
   Ethics_Officer = "Ethics_Officer",
   Administrative_Complaints_Team = "Administrative_Complaints_Team",
   IT_Officer = "IT_Officer",
   Vehicle_Inspector = "Vehicle_Inspector",
}

// Map backend roles to frontend normalized roles
const backendToFrontendRoleMap: Record<BackendUserRole, UserRole> = {
  [BackendUserRole.ADMIN]: "admin",
  [BackendUserRole.Department_Head]: "department_head",
  [BackendUserRole.Commissioner]: "commissioner",
  [BackendUserRole.END_USER]: "employee",
  [BackendUserRole.Driver]: "driver",
  [BackendUserRole.Maintenance_Team]: "maintenance_team",
  [BackendUserRole.Maintenace_Team]: "maintenance_team",
  [BackendUserRole.Announcement_Creator]: "ads_editor",
  [BackendUserRole.Women_Social_Inclusion]: "women_social_inclusion",
  [BackendUserRole.Feedback_Complaint_Manager]: "feedback_complaint_manager",
  [BackendUserRole.Feedback_Complaint_Officer]: "feedback_complaint_officer",
  [BackendUserRole.Ethics_Anti_Corruption]: "ethics_anti_corruption",
  [BackendUserRole.Ethics_Officer]: "ethics_officer",
  [BackendUserRole.Administrative_Complaints_Team]: "administrative_complaints_team",
  [BackendUserRole.IT_Officer]: "it_officer",
  [BackendUserRole.Vehicle_Inspector]: "vehicle_inspector",
};

// Read token from browser storage
export function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem("accessToken") ||
    window.localStorage.getItem("jwt") ||
    window.localStorage.getItem("token") ||
    null
  );
}

// Decode JWT
export function decodeJwt(token: string): DecodedJwt | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof window !== "undefined"
        ? atob(payload)
        : Buffer.from(payload, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Normalize backend role string
function normalizeBackendRole(role: string): UserRole | null {
  if (!role) return null;
  const key = role as BackendUserRole;
  return backendToFrontendRoleMap[key] || null;
}

// Normalize legacy role strings
function normalizeRoleString(r: string): UserRole | null {
  const s = r.toLowerCase();
  // Direct check for IT_Officer (exact match from backend)
  if (r === "IT_Officer") return "it_officer";
  // Direct check for Ethics_Officer (exact match from backend)
  if (r === "Ethics_Officer") return "ethics_officer";
  // Direct check for Commissioner (exact match from backend)
  if (r === "Commissioner") return "commissioner";
  // Direct check for Feedback_Complaint_Manager (exact match from backend)
  if (r === "Feedback_Complaint_Manager") return "feedback_complaint_manager";
  // Direct check for Feedback_Complaint_Officer (exact match from backend)
  if (r === "Feedback_Complaint_Officer") return "feedback_complaint_officer";
  // Direct check for Administrative_Complaints_Team (exact match from backend)
  if (r === "Administrative_Complaints_Team") return "administrative_complaints_team";
  if (/(^|\W)(employee)(\W|$)/.test(s)) return "employee";
  if (/(^|\W)(dept|department[_-]?head|head)(\W|$)/.test(s)) return "department_head";
  if (/(^|\W)(manager)(\W|$)/.test(s)) return "manager";
  if (/(^|\W)(team[_-]?lead(er)?)(\W|$)/.test(s)) return "manager";
  if (/(^|\W)(gm|general[_-]?manager|commissioner)(\W|$)/i.test(s)) return "commissioner";
  if (/(^|\W)(admin|administrator)(\W|$)/.test(s)) return "admin";
  if (/(^|\W)(women[_-]?social[_-]?inclusion|women\s+social\s+inclusion)(\W|$)/.test(s)) return "women_social_inclusion";
  if (/(^|\W)(ethics[_-]?officer)(\W|$)/i.test(r)) return "ethics_officer";
  if (/(^|\W)(ethics|anti[_-]?corruption|ethics\s*&?\s*anti[- ]corruption)(\W|$)/.test(s)) return "ethics_anti_corruption";
  if (/(^|\W)(ads[_-]?admin|advert(isement)?s?[_-]?admin|communications[_-]?admin)(\W|$)/.test(s))
    return "ads_admin";
  if (/(^|\W)(ads[_-]?editor|advert(isement)?s?[_-]?editor|content[_-]?editor|communications)(\W|$)/.test(s))
    return "ads_editor";
  if (/(^|\W)(ads[_-]?viewer|advert(isement)?s?[_-]?viewer)(\W|$)/.test(s)) return "ads_viewer";
  // Maintenance team (handle common spellings and formats)
  if (/(^|\W)mainten(a|e)nance[_-]?team(\W|$)/.test(s)) return "maintenance_team";
  // IT Officer role (handle both it_officer and IT_Officer)
  if (/(^|\W)it[_-]?officer(\W|$)/i.test(r)) return "it_officer";
  // Vehicle Inspector role
  if (/(^|\W)vehicle[_-]?inspector(\W|$)/i.test(r)) return "vehicle_inspector";
  // Feedback and Complaint Manager role
  if (/(^|\W)feedback[_-]?complaint[_-]?manager(\W|$)/i.test(r)) return "feedback_complaint_manager";
  // Feedback and Complaint Officer role
  if (/(^|\W)feedback[_-]?complaint[_-]?officer(\W|$)/i.test(r)) return "feedback_complaint_officer";
  return null;
}

// Get all user roles from token
export function getCurrentUserRoles(): UserRole[] {
  const token = readToken();
  if (!token) return [];
  const decoded = decodeJwt(token);
  if (!decoded) return [];

  const candidates: string[] = [];

  if (typeof decoded.role === "string") candidates.push(decoded.role);
  if (Array.isArray(decoded.role)) candidates.push(...decoded.role);

  if (Array.isArray(decoded.roles)) {
    for (const r of decoded.roles) {
      if (typeof r === "string") candidates.push(r);
      else if (r && typeof r.name === "string") candidates.push(r.name);
    }
  }

  if (decoded.realm_access?.roles) candidates.push(...decoded.realm_access.roles);
  if (decoded.resource_access) {
    for (const v of Object.values(decoded.resource_access)) {
      if (Array.isArray(v?.roles)) candidates.push(...v.roles);
    }
  }

  const mapped = new Set<UserRole>();
  for (const c of candidates) {
    // Direct check for IT_Officer before normalization (case-insensitive)
    if (String(c).toLowerCase() === "it_officer") {
      mapped.add("it_officer");
      continue;
    }
    // Direct check for ethics_officer before normalization (case-insensitive)
    if (String(c).toLowerCase() === "ethics_officer") {
      mapped.add("ethics_officer");
      continue;
    }
    // Direct check for feedback_complaint_manager before normalization (case-insensitive)
    if (String(c).toLowerCase() === "feedback_complaint_manager") {
      mapped.add("feedback_complaint_manager");
      continue;
    }
    // Direct check for feedback_complaint_officer before normalization (case-insensitive)
    if (String(c).toLowerCase() === "feedback_complaint_officer") {
      mapped.add("feedback_complaint_officer");
      continue;
    }
    // Direct check for administrative_complaints_team before normalization (case-insensitive)
    if (String(c).toLowerCase() === "administrative_complaints_team") {
      mapped.add("administrative_complaints_team");
      continue;
    }
    const frontendRole = normalizeRoleString(String(c)) || normalizeBackendRole(String(c));
    if (frontendRole) mapped.add(frontendRole);
  }

  return mapped.size ? Array.from(mapped) : ["employee"];
}

// Get primary role (highest priority)
export function getCurrentUserPrimaryRole(): UserRole {
  const all = getCurrentUserRoles();
  if (all.includes("admin")) return "admin";
  if (all.includes("commissioner")) return "commissioner";
  if (all.includes("feedback_complaint_manager")) return "feedback_complaint_manager";
  if (all.includes("administrative_complaints_team")) return "administrative_complaints_team";
  if (all.includes("manager")) return "manager";
  if (all.includes("it_officer")) return "it_officer";
  // Feedback and Complaint roles
  if (all.includes("feedback_complaint_officer")) return "feedback_complaint_officer";
  // Ethics roles: treat as high-priority oversight roles
  if (all.includes("ethics_anti_corruption")) return "ethics_anti_corruption";
  if (all.includes("ethics_officer")) return "ethics_officer";
  // Treat women_social_inclusion like a specialized department head role.
  if (all.includes("women_social_inclusion")) return "women_social_inclusion";
  if (all.includes("department_head")) return "department_head";
  if (all.includes("driver")) return "driver";
  if (all.includes("maintenance_team")) return "maintenance_team";
  return "employee";
}

// Get current user ID
export function getCurrentUserId(): string | null {
  const token = readToken();
  if (!token) return null;
  const decoded = decodeJwt(token);
  if (!decoded) return null;
  return (decoded.id as string) || (decoded.userId as string) || (decoded.sub as string) || null;
}

export function getCurrentUserEmail(): string | null {
  const token = readToken();
  if (!token) return null;
  const decoded = decodeJwt(token);
  if (!decoded) return null;
  return (decoded.email as string) || (decoded.preferred_username as string) || null;
}

export function getCurrentUserPosition(): string | null {
  const token = readToken();
  if (!token) return null;
  const decoded = decodeJwt(token);
  if (!decoded) return null;
  return (decoded.position as string) || null;
}

export function getCurrentUserName(): string | null {
  const token = readToken();
  if (!token) return null;
  const decoded = decodeJwt(token);
  if (!decoded) return null;
  // Check multiple possible field names for user name
  return (decoded.name as string) ||
         (decoded.firstName as string) ||
         (decoded.given_name as string) ||
         (decoded.preferred_username as string) ||
         (decoded.email as string) ||
         null;
}

export function getCurrentUserPhone(): string | null {
  const token = readToken();
  if (!token) return null;
  const decoded = decodeJwt(token);
  if (!decoded) return null;
  // Check multiple possible field names for phone
  return (decoded.phone as string) ||
         (decoded.phoneNumber as string) ||
         (decoded.mobile as string) ||
         null;
}

// Clear tokens
export function clearAuthTokens() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem("accessToken");
    window.localStorage.removeItem("jwt");
    window.localStorage.removeItem("token");
  } catch {}
}

// Sign out
export function signOut(redirectTo: string = "/") {
  if (typeof window === "undefined") return;
  clearAuthTokens();
  try {
    window.localStorage.setItem("auth:signout", String(Date.now()));
  } catch {}
  window.location.href = redirectTo;
}