// Mock advertisements API with in-memory store
export type AdStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED'

export interface MockAd {
  id: string
  title: string
  description: string
  category: 'HR' | 'Communication' | 'Other'
  status: AdStatus
  createdAt: string
  ownerName: string
  likes: number
  shares: number
  comments: { id: string; text: string; author: string; createdAt: string }[]
}

let SEQ = 5
const nowIso = () => new Date().toISOString()

type AuditAction = 'CREATE' | 'SUBMIT_REVIEW' | 'PUBLISH' | 'ARCHIVE' | 'LIKE' | 'SHARE' | 'COMMENT'
export interface AuditEvent {
  id: string
  at: string
  action: AuditAction
  adId: string
  actor: string
  meta?: Record<string, any>
}

const STORAGE_KEYS = {
  ads: 'mock_ads_store',
  audit: 'mock_ads_audit',
}

function loadState<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function saveState<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

function log(action: AuditAction, adId: string, actor: string, meta?: Record<string, any>) {
  const evt: AuditEvent = { id: `e${Math.random().toString(36).slice(2,8)}`, at: nowIso(), action, adId, actor, meta }
  audit.unshift(evt)
  saveState(STORAGE_KEYS.audit, audit)
}

let ads: MockAd[] = loadState<MockAd[]>(STORAGE_KEYS.ads, [
  {
    id: '1',
    title: 'HR: Annual Leave Policy Update',
    description: 'New leave policy details effective next month.',
    category: 'HR',
    status: 'PUBLISHED',
    createdAt: nowIso(),
    ownerName: 'HR Team',
    likes: 12,
    shares: 3,
    comments: [
      { id: 'c1', text: 'Thanks for the update!', author: 'Alice', createdAt: nowIso() },
    ],
  },
  {
    id: '2',
    title: 'Comms: Townhall Invitation',
    description: 'Company-wide townhall on Friday 3pm.',
    category: 'Communication',
    status: 'PUBLISHED',
    createdAt: nowIso(),
    ownerName: 'Communications',
    likes: 5,
    shares: 1,
    comments: [],
  },
  {
    id: '3',
    title: 'Draft: Open Enrollment',
    description: 'Benefits open enrollment starts next week.',
    category: 'HR',
    status: 'DRAFT',
    createdAt: nowIso(),
    ownerName: 'HR Team',
    likes: 0,
    shares: 0,
    comments: [],
  },
  {
    id: '4',
    title: 'PENDING: Social Media Guidelines',
    description: 'Awaiting review by HR.',
    category: 'Communication',
    status: 'PENDING_REVIEW',
    createdAt: nowIso(),
    ownerName: 'Communications',
    likes: 0,
    shares: 0,
    comments: [],
  },
])
let audit: AuditEvent[] = loadState<AuditEvent[]>(STORAGE_KEYS.audit, [])

export function listAds(params?: { status?: AdStatus | 'ALL' }): Promise<MockAd[]> {
  const s = params?.status && params.status !== 'ALL' ? params.status : undefined
  return Promise.resolve(s ? ads.filter(a => a.status === s) : [...ads])
}

export function createAd(input: { title: string; description: string; category: MockAd['category']; ownerName: string; actor?: string }): Promise<MockAd> {
  const ad: MockAd = {
    id: String(++SEQ),
    title: input.title,
    description: input.description,
    category: input.category,
    status: 'DRAFT',
    createdAt: nowIso(),
    ownerName: input.ownerName,
    likes: 0,
    shares: 0,
    comments: [],
  }
  ads = [ad, ...ads]
  saveState(STORAGE_KEYS.ads, ads)
  log('CREATE', ad.id, input.actor || input.ownerName)
  return Promise.resolve(ad)
}

export function submitForReview(adId: string, actor = 'System'): Promise<MockAd> {
  const ad = ads.find(a => a.id === adId)
  if (!ad) throw new Error('Not found')
  ad.status = 'PENDING_REVIEW'
  saveState(STORAGE_KEYS.ads, ads)
  log('SUBMIT_REVIEW', adId, actor)
  return Promise.resolve(ad)
}

export function publishAd(adId: string, actor = 'System'): Promise<MockAd> {
  const ad = ads.find(a => a.id === adId)
  if (!ad) throw new Error('Not found')
  ad.status = 'PUBLISHED'
  saveState(STORAGE_KEYS.ads, ads)
  log('PUBLISH', adId, actor)
  return Promise.resolve(ad)
}

export function archiveAd(adId: string, actor = 'System'): Promise<MockAd> {
  const ad = ads.find(a => a.id === adId)
  if (!ad) throw new Error('Not found')
  ad.status = 'ARCHIVED'
  saveState(STORAGE_KEYS.ads, ads)
  log('ARCHIVE', adId, actor)
  return Promise.resolve(ad)
}

export function likeAd(adId: string, actor = 'User'): Promise<MockAd> {
  const ad = ads.find(a => a.id === adId)
  if (!ad) throw new Error('Not found')
  ad.likes += 1
  saveState(STORAGE_KEYS.ads, ads)
  log('LIKE', adId, actor)
  return Promise.resolve(ad)
}

export function shareAd(adId: string, actor = 'User'): Promise<MockAd> {
  const ad = ads.find(a => a.id === adId)
  if (!ad) throw new Error('Not found')
  ad.shares += 1
  saveState(STORAGE_KEYS.ads, ads)
  log('SHARE', adId, actor)
  return Promise.resolve(ad)
}

export function commentAd(adId: string, text: string, author: string): Promise<MockAd> {
  const ad = ads.find(a => a.id === adId)
  if (!ad) throw new Error('Not found')
  ad.comments.unshift({ id: `c${Math.random().toString(36).slice(2, 8)}`, text, author, createdAt: nowIso() })
  saveState(STORAGE_KEYS.ads, ads)
  log('COMMENT', adId, author, { text })
  return Promise.resolve(ad)
}

export function getAudit(): Promise<AuditEvent[]> {
  return Promise.resolve([...audit])
}
