import { apiGet, apiPost, apiPatch, apiDelete } from "./api";

export type AdvertisementCategory = "HR" | "Recruitment" | "Benefits" | "Policies" | "Training" | "Announcements" | "IT" | "Facilities" | "Other";
export type AdvertisementPriority = "Low" | "Medium" | "High" | "Critical";

export interface AdvertisementDTO {
  id: string;
  title: string;
  description: string;
  content?: string;
  category: AdvertisementCategory;
  priority?: AdvertisementPriority;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'REJECTED';
  attachments?: Array<{ id?: string; name: string; url: string; type?: string; size?: number }>;
  publishDate?: string; // ISO
  expiryDate?: string; // ISO
  isPublished?: boolean;
  isUrgent?: boolean;
  createdAt?: string;
  updatedAt?: string;
  ownerId?: string;
  ownerName?: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewNotes?: string;
  reviewDate?: string;
  likeCount?: number;
  shareCount?: number;
  viewCount?: number;
  comments?: Array<{ id: string; text: string; author?: string; createdAt: string }>;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listAdvertisements(params?: {
  q?: string;
  category?: AdvertisementCategory | "All";
  status?: AdvertisementDTO['status'];
  ownerId?: string;
  sort?: "newest" | "oldest";
  page?: number;
  pageSize?: number;
  includeDrafts?: boolean;
}): Promise<Paginated<AdvertisementDTO>> {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.category && params.category !== "All") query.set("category", params.category);
  if (params?.status) query.set("status", params.status);
  if (params?.ownerId) query.set("ownerId", params.ownerId);
  if (params?.sort) query.set("sort", params.sort);
  if (params?.page) query.set("page", String(params.page));
  if (params?.pageSize) query.set("pageSize", String(params.pageSize));
  if (params?.includeDrafts) query.set("includeDrafts", "true");
  return apiGet(`/advertisements?${query.toString()}`);
}

export async function createAdvertisement(body: {
  title: string;
  description: string;
  category: AdvertisementCategory;
  priority?: AdvertisementPriority;
  publishDate?: string;
  expiryDate?: string;
  isPublished?: boolean;
  isUrgent?: boolean;
}): Promise<AdvertisementDTO> {
  return apiPost(`/advertisements`, body);
}

export async function updateAdvertisement(id: string, body: Partial<Pick<AdvertisementDTO, 'title' | 'description' | 'category' | 'priority' | 'publishDate' | 'expiryDate' | 'isPublished' | 'isUrgent'>>): Promise<AdvertisementDTO> {
  return apiPatch(`/advertisements/${encodeURIComponent(id)}`, body);
}

export async function deleteAdvertisement(id: string): Promise<{ success: boolean }> {
  return apiDelete(`/advertisements/${encodeURIComponent(id)}`);
}

export async function uploadAttachments(adId: string, files: File[]): Promise<AdvertisementDTO> {
  const form = new FormData();
  for (const f of files) form.append("files", f);

  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("accessToken") ||
        window.localStorage.getItem("jwt") ||
        window.localStorage.getItem("token")
      : null;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"}/api/v1/advertisements/${adId}/attachments`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  if (!res.ok) throw new Error("Attachment upload failed");
  return res.json();
}

export async function getAdvertisement(adId: string): Promise<AdvertisementDTO> {
  return apiGet(`/advertisements/${encodeURIComponent(adId)}`);
}

export async function likeAdvertisement(adId: string): Promise<AdvertisementDTO> {
  return apiPost(`/advertisements/${adId}/like`);
}

export async function shareAdvertisement(adId: string): Promise<AdvertisementDTO> {
  return apiPost(`/advertisements/${adId}/share`);
}

export async function listAdComments(
  adId: string,
  page = 1,
  pageSize = 10
): Promise<{ items: Array<{ id: string; text: string; author?: string; createdAt: string }>; total: number; page: number; pageSize: number }>{
  const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  return apiGet(`/advertisements/${adId}/comments?${qs.toString()}`);
}

export async function addAdComment(adId: string, text: string, author?: string): Promise<{ id: string; text: string; author?: string; createdAt: string }> {
  return apiPost(`/advertisements/${adId}/comments`, { text, author });
}

export async function updateAdComment(adId: string, commentId: string, text: string): Promise<{ id: string; text: string; author?: string; createdAt: string }>{
  return apiPatch(`/advertisements/${adId}/comments/${commentId}`, { text });
}

export async function deleteAdComment(adId: string, commentId: string): Promise<{ success: boolean }>{
  return apiDelete(`/advertisements/${adId}/comments/${commentId}`);
}

// New advertisement management functions
export async function publishAdvertisement(adId: string): Promise<AdvertisementDTO> {
  return apiPost(`/advertisements/${adId}/publish`);
}

export async function submitForReview(adId: string): Promise<AdvertisementDTO> {
  return apiPost(`/advertisements/${adId}/submit-review`);
}

export async function reviewAdvertisement(adId: string, action: 'approve' | 'reject', notes?: string): Promise<AdvertisementDTO> {
  return apiPost(`/advertisements/${adId}/review`, { action, notes });
}

export async function saveAsDraft(adId: string, body: Partial<Pick<AdvertisementDTO, 'title' | 'description' | 'category' | 'priority' | 'publishDate' | 'expiryDate' | 'isUrgent'>>): Promise<AdvertisementDTO> {
  return apiPatch(`/advertisements/${adId}`, { ...body, status: 'DRAFT' });
}

export async function getDrafts(ownerId?: string): Promise<AdvertisementDTO[]> {
  const params = new URLSearchParams();
  params.set('status', 'DRAFT');
  if (ownerId) params.set('ownerId', ownerId);
  const result = await apiGet(`/advertisements?${params.toString()}`);
  return (result as any)?.items || [];
}

export async function getPendingReviews(): Promise<AdvertisementDTO[]> {
  const result = await apiGet('/advertisements?status=PENDING_REVIEW');
  return (result as any)?.items || [];
}

export async function getMyAdvertisements(ownerId: string): Promise<AdvertisementDTO[]> {
  const result = await apiGet(`/advertisements?ownerId=${ownerId}`);
  return (result as any)?.items || [];
}

export async function searchAdvertisements(query: string, filters?: {
  category?: AdvertisementCategory | "All";
  status?: AdvertisementDTO['status'];
  ownerId?: string;
}): Promise<AdvertisementDTO[]> {
  const params = new URLSearchParams();
  params.set('q', query);
  if (filters?.category && filters.category !== "All") params.set('category', filters.category);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.ownerId) params.set('ownerId', filters.ownerId);
  const result = await apiGet(`/advertisements?${params.toString()}`);
  return (result as any)?.items || [];
}

// HR-specific API functions
export async function getHRAdvertisements(params?: {
  category?: AdvertisementCategory | "All";
  status?: AdvertisementDTO['status'];
  priority?: AdvertisementPriority | "All";
  q?: string;
  sort?: "newest" | "oldest";
  page?: number;
  pageSize?: number;
  includeStats?: boolean;
}): Promise<{
  items: AdvertisementDTO[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: any;
  stats?: any;
}> {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.status) query.set('status', params.status);
  if (params?.priority) query.set('priority', params.priority);
  if (params?.q) query.set('q', params.q);
  if (params?.sort) query.set('sort', params.sort);
  if (params?.page) query.set('page', params.page.toString());
  if (params?.pageSize) query.set('pageSize', params.pageSize.toString());
  if (params?.includeStats) query.set('includeStats', 'true');
  
  return await apiGet(`/advertisements/hr?${query.toString()}`);
}

export async function getHRJobPostings(params?: {
  status?: AdvertisementDTO['status'];
  jobType?: string;
  department?: string;
  experienceLevel?: string;
  q?: string;
  sort?: "newest" | "oldest";
  page?: number;
  pageSize?: number;
}): Promise<{
  items: AdvertisementDTO[];
  pagination: any;
  filters: any;
  stats: any;
}> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.jobType) query.set('jobType', params.jobType);
  if (params?.department) query.set('department', params.department);
  if (params?.experienceLevel) query.set('experienceLevel', params.experienceLevel);
  if (params?.q) query.set('q', params.q);
  if (params?.sort) query.set('sort', params.sort);
  if (params?.page) query.set('page', params.page.toString());
  if (params?.pageSize) query.set('pageSize', params.pageSize.toString());
  
  return await apiGet(`/advertisements/hr/recruitment?${query.toString()}`);
}

export async function getHRPolicies(params?: {
  status?: AdvertisementDTO['status'];
  policyType?: string;
  priority?: AdvertisementPriority | "All";
  q?: string;
  sort?: "newest" | "oldest";
  page?: number;
  pageSize?: number;
}): Promise<{
  items: AdvertisementDTO[];
  pagination: any;
  filters: any;
  stats: any;
}> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.policyType) query.set('policyType', params.policyType);
  if (params?.priority) query.set('priority', params.priority);
  if (params?.q) query.set('q', params.q);
  if (params?.sort) query.set('sort', params.sort);
  if (params?.page) query.set('page', params.page.toString());
  if (params?.pageSize) query.set('pageSize', params.pageSize.toString());
  
  return await apiGet(`/advertisements/hr/policies?${query.toString()}`);
}

export async function getHRAnalytics(params?: {
  category?: AdvertisementCategory;
  timeRange?: number;
  includeUrgent?: boolean;
  includeExpiring?: boolean;
}): Promise<{
  overview: any;
  engagement: any;
  recentActivity: any;
  categoryData?: any;
  urgentAds?: any;
  expiringAds?: any;
  timeRange: number;
}> {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.timeRange) query.set('timeRange', params.timeRange.toString());
  if (params?.includeUrgent) query.set('includeUrgent', 'true');
  if (params?.includeExpiring) query.set('includeExpiring', 'true');
  
  return await apiGet(`/advertisements/hr/analytics?${query.toString()}`);
}

export async function getHRDashboard(params?: {
  timeRange?: number;
  includeRecent?: boolean;
  includeUrgent?: boolean;
  includeExpiring?: boolean;
}): Promise<{
  user: any;
  overview: any;
  engagement: any;
  categoryBreakdown: any;
  statusBreakdown: any;
  recentAds: any;
  urgentAds: any;
  expiringAds: any;
  topPerforming: any;
  timeRange: number;
}> {
  const query = new URLSearchParams();
  if (params?.timeRange) query.set('timeRange', params.timeRange.toString());
  if (params?.includeRecent) query.set('includeRecent', 'true');
  if (params?.includeUrgent) query.set('includeUrgent', 'true');
  if (params?.includeExpiring) query.set('includeExpiring', 'true');
  
  return await apiGet(`/advertisements/hr/dashboard?${query.toString()}`);
}

export async function createHRAdvertisement(data: {
  title: string;
  description: string;
  category: AdvertisementCategory;
  priority?: AdvertisementPriority;
  publishDate?: string;
  expiryDate?: string;
  isPublished?: boolean;
  isUrgent?: boolean;
  ownerId?: string;
  ownerName?: string;
}): Promise<AdvertisementDTO> {
  return await apiPost('/advertisements/hr', data);
}

export async function createJobPosting(data: {
  title: string;
  description: string;
  jobType?: string;
  department?: string;
  experienceLevel?: string;
  location?: string;
  salary?: string;
  responsibilities?: string;
  requirements?: string;
  benefits?: string;
  applicationDeadline?: string;
  contactEmail: string;
  priority?: AdvertisementPriority;
  publishDate?: string;
  expiryDate?: string;
  isPublished?: boolean;
  isUrgent?: boolean;
  ownerId?: string;
  ownerName?: string;
}): Promise<AdvertisementDTO> {
  return await apiPost('/advertisements/hr/recruitment', data);
}

export async function createPolicyUpdate(data: {
  title: string;
  description: string;
  policyType?: string;
  priority?: AdvertisementPriority;
  effectiveDate?: string;
  acknowledgmentDeadline?: string;
  policySummary?: string;
  keyChanges?: string;
  complianceRequirements?: string;
  contactInfo?: string;
  publishDate?: string;
  expiryDate?: string;
  isPublished?: boolean;
  isUrgent?: boolean;
  ownerId?: string;
  ownerName?: string;
}): Promise<AdvertisementDTO> {
  return await apiPost('/advertisements/hr/policies', data);
}

export async function bulkHROperations(data: {
  action: 'publish' | 'submit_review' | 'draft' | 'expire' | 'delete' | 'update_priority' | 'mark_urgent' | 'update_category';
  advertisementIds: string[];
  data?: any;
}): Promise<{
  action: string;
  totalProcessed: number;
  successful: number;
  failed: number;
  results: any[];
  errors: any[];
}> {
  return await apiPost('/advertisements/hr/bulk', data);
}

export async function getHRBulkSummary(params?: {
  status?: AdvertisementDTO['status'];
  category?: AdvertisementCategory | "All";
  priority?: AdvertisementPriority | "All";
  urgent?: boolean;
}): Promise<{
  summary: any;
  advertisements: any[];
}> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.category) query.set('category', params.category);
  if (params?.priority) query.set('priority', params.priority);
  if (params?.urgent) query.set('urgent', 'true');
  
  return await apiGet(`/advertisements/hr/bulk?${query.toString()}`);
}

