import { apiGet, apiPatch, apiPost } from "@/app/lib/api"

export type UserRole = "ADMIN" | "Department_Head" | "Commissioner" | "END_USER" | "Driver" | "Maintenace_Team" | "Announcement_Creator" | "Women_Social_Inclusion" | "Ethics_Anti_Corruption" | "IT_Officer" | "Finance_Department" | "Vehicle_Inspector" | "Administrative_Complaints_Team"

export interface UserSummary {
  id: string
  email: string
  firstName: string
  middleName?: string | null
  lastName: string
  firstNameAm?: string | null
  middleNameAm?: string | null
  lastNameAm?: string | null
  phone?: string | null
  roles: string[]
  userType: "INTERNAL" | "EXTERNAL"
  department?: string | null
  employeeId?: string | null
  position?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UsersPage {
  users: UserSummary[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface CreateUserDto {
  email: string
  firstName: string
  lastName: string
  password: string
  role: UserRole
  userType: "INTERNAL" | "EXTERNAL"
  phone?: string
  department?: string
}

export interface UpdateUserDto {
  firstName?: string
  lastName?: string
  phone?: string
  role?: UserRole
  userType?: "INTERNAL" | "EXTERNAL"
  department?: string
  isActive?: boolean
}

export const usersApi = {
  // GET /api/v1/users?page=&limit=&role=&search=
  list: (params?: { page?: number; limit?: number; role?: UserRole; search?: string }) => {
    const q = new URLSearchParams()
    if (params?.page) q.set("page", String(params.page))
    if (params?.limit) q.set("limit", String(params.limit))
    if (params?.role) q.set("role", params.role)
    if (params?.search) q.set("search", params.search)
    const qs = q.toString()
    return apiGet<UsersPage>(`/users${qs ? `?${qs}` : ""}`)
  },

  // GET /api/v1/users/:id
  getById: (id: string) => apiGet<UserSummary>(`/users/${id}`),

  // POST /api/v1/users
  create: (dto: CreateUserDto) => apiPost<UserSummary>(`/users`, dto),

  // PATCH /api/v1/users/:id
  update: (id: string, dto: UpdateUserDto) => apiPatch<UserSummary>(`/users/${id}`, dto),

  // DELETE /api/v1/users/:id (soft deactivate)
  deactivate: (id: string) => apiPost<UserSummary>(`/users/${id}?_method=DELETE`),
}
