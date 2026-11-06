export type AdStatus = "published" | "draft" | "archived" | "pending"

export interface AdPost {
  id: string
  slug: string
  title: string
  category: string
  postingAt: string
  deadlineAt?: string
  referenceNo?: string
  body: string
  eligibility?: string
  application?: string
  importantDates?: string
  downloads?: { label: string; url: string }[]
  location?: string
  featuredImage?: string
  videoUrl?: string
  attachments?: { label: string; url: string }[]
  media?: { type: 'image'|'video'; url: string; caption?: string }[]
  tags: string[]
  metaDescription?: string
  author?: string
  status: AdStatus
  visibility: "public" | "private" | "draft"
  createdAt: string
  updatedAt: string
  views: number
  likes: number
}

export interface AdComment {
  id: string
  adId: string
  parentId?: string
  author: string
  content: string
  createdAt: string
  up: number
  down: number
  reported?: boolean
}

let NEXT_ID = 1
let NEXT_COMMENT = 1
let NEXT_SUB = 1

export const ADS: AdPost[] = []
export const COMMENTS: AdComment[] = []
export const SUBSCRIPTIONS: { id: string; email: string; createdAt: string }[] = []
export interface AdsBranding {
  companyName: string
  logoUrl?: string
  slogan?: string
}
export let BRANDING: AdsBranding = { companyName: "" }

export function nextAdId() {
  return String(NEXT_ID++)
}
export function nextCommentId() {
  return String(NEXT_COMMENT++)
}
export function nextSubId() {
  return String(NEXT_SUB++)
}

export function slugify(s: string) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export function findBySlug(slug: string): AdPost | undefined {
  return ADS.find((a) => a.slug === slug)
}

export function getAdById(id: string): AdPost | undefined {
  return ADS.find((a) => a.id === id)
}

export function upsertAd(input: Partial<AdPost> & { title: string }): AdPost {
  const now = new Date().toISOString()
  const slug = input.slug ? slugify(input.slug) : slugify(input.title)
  const id = input.id || nextAdId()
  const existingIdx = ADS.findIndex((a) => a.id === id)
  const base: AdPost = {
    id,
    slug,
    title: input.title,
    category: input.category || "General",
    postingAt: input.postingAt || now,
    deadlineAt: input.deadlineAt,
    referenceNo: input.referenceNo,
    body: input.body || "",
    eligibility: input.eligibility,
    application: input.application,
    importantDates: input.importantDates,
    downloads: input.downloads || [],
    location: input.location,
    featuredImage: input.featuredImage,
    videoUrl: input.videoUrl,
    attachments: input.attachments || [],
    media: input.media || [],
    tags: input.tags || [],
    metaDescription: input.metaDescription,
    author: input.author || "Admin",
    status: (input.status as AdStatus) || "draft",
    visibility: (input.visibility as any) || "public",
    createdAt: existingIdx >= 0 ? ADS[existingIdx].createdAt : now,
    updatedAt: now,
    views: existingIdx >= 0 ? ADS[existingIdx].views : 0,
    likes: existingIdx >= 0 ? ADS[existingIdx].likes : 0,
  }
  if (existingIdx >= 0) {
    ADS[existingIdx] = base
    return ADS[existingIdx]
  } else {
    ADS.push(base)
    return base
  }
}

export function queryAds(params: { q?: string; category?: string; status?: AdStatus; tag?: string } = {}) {
  autoArchiveExpired()
  const { q, category, status, tag } = params
  let list = ADS.slice()
  if (q) {
    const t = q.toLowerCase()
    list = list.filter((a) =>
      a.title.toLowerCase().includes(t) ||
      a.body.toLowerCase().includes(t) ||
      a.tags.some((tg) => tg.toLowerCase().includes(t))
    )
  }
  if (category) list = list.filter((a) => a.category === category)
  if (status) list = list.filter((a) => a.status === status)
  if (tag) list = list.filter((a) => a.tags.includes(tag))
  // sort by posting date desc
  return list.sort((a, b) => (b.postingAt || '').localeCompare(a.postingAt || ''))
}

export function addView(adId: string) {
  const ad = getAdById(adId)
  if (ad) ad.views += 1
}

export function addLike(adId: string) {
  const ad = getAdById(adId)
  if (ad) ad.likes += 1
  return ad
}

export function addComment(adId: string, author: string, content: string, parentId?: string): AdComment {
  const c: AdComment = {
    id: nextCommentId(),
    adId,
    parentId,
    author,
    content,
    createdAt: new Date().toISOString(),
    up: 0,
    down: 0,
  }
  COMMENTS.push(c)
  return c
}

export function getComments(adId: string) {
  return COMMENTS.filter((c) => c.adId === adId)
}

export function voteComment(commentId: string, dir: 'up'|'down') {
  const c = COMMENTS.find(c=>c.id===commentId)
  if (!c) return null
  if (dir === 'up') c.up += 1; else c.down += 1
  return c
}

export function reportComment(commentId: string) {
  const c = COMMENTS.find(c=>c.id===commentId)
  if (!c) return null
  c.reported = true
  return c
}

export function addSubscription(email: string) {
  const exists = SUBSCRIPTIONS.some(s=>s.email.toLowerCase()===email.toLowerCase())
  if (exists) return null
  const s = { id: nextSubId(), email, createdAt: new Date().toISOString() }
  SUBSCRIPTIONS.push(s)
  return s
}

export function autoArchiveExpired() {
  const now = Date.now()
  for (const a of ADS) {
    if (a.deadlineAt && new Date(a.deadlineAt).getTime() < now && a.status !== 'archived') {
      a.status = 'archived'
    }
  }
}

export function isNew(ad: AdPost) {
  const days = 7
  const created = new Date(ad.createdAt).getTime()
  return Date.now() - created <= days * 86400000
}
export function isHot(ad: AdPost) {
  return ad.likes >= 10
}
export function isExpiringSoon(ad: AdPost) {
  if (!ad.deadlineAt) return false
  const diff = new Date(ad.deadlineAt).getTime() - Date.now()
  return diff > 0 && diff <= 3 * 86400000
}

export function getBranding(): AdsBranding { return BRANDING }
export function setBranding(input: Partial<AdsBranding>) {
  BRANDING = { ...BRANDING, ...input }
  return BRANDING
}
