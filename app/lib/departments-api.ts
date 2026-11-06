import { apiGet, apiPatch, apiPost, apiDelete } from "@/app/lib/api"

export interface DepartmentSummary {
  id: string
  name: string
  nameAm?: string | null
  description?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface DepartmentsPage {
  departments: DepartmentSummary[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface CreateDepartmentDto {
  name: string
  nameAm?: string
  description?: string
  isActive?: boolean
}

export interface UpdateDepartmentDto {
  name?: string
  nameAm?: string
  description?: string
  isActive?: boolean
}

export const departmentsApi = {
  // GET /api/v1/departments?page=&limit=&search=
  list: (params?: { page?: number; limit?: number; search?: string }) => {
    const q = new URLSearchParams()
    if (params?.page) q.set("page", String(params.page))
    if (params?.limit) q.set("limit", String(params.limit))
    if (params?.search) q.set("search", params.search)
    const qs = q.toString()
    return apiGet<DepartmentsPage>(`/departments${qs ? `?${qs}` : ""}`)
  },

  // GET /api/v1/departments/:id
  getById: (id: string) => apiGet<DepartmentSummary>(`/departments/${id}`),

  // POST /api/v1/departments
  create: (dto: CreateDepartmentDto) => apiPost<DepartmentSummary>(`/departments`, dto),

  // PATCH /api/v1/departments/:id
  update: (id: string, dto: UpdateDepartmentDto) => apiPatch<DepartmentSummary>(`/departments/${id}`, dto),

  // DELETE /api/v1/departments/:id (soft deactivate)
  deactivate: (id: string) => apiDelete<DepartmentSummary>(`/departments/${id}`),
}
