import { promises as fs } from "fs"
import path from "path"

type RequestItem = {
  id: string
  role: string
  type: string
  subject: string
  description?: string
  vehicleId?: string
  amount?: number
  preferredDate?: string
  createdAt: string
}

const DATA_DIR = path.join(process.cwd(), "data")
const FILE = path.join(DATA_DIR, "requests.json")

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch {
    /* ignore */
  }
}

export async function getRequests(): Promise<RequestItem[]> {
  try {
    await ensureDataDir()
    const raw = await fs.readFile(FILE, "utf-8")
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as RequestItem[]
    return []
  } catch {
    return []
  }
}

export async function addRequest(item: Partial<RequestItem>): Promise<RequestItem> {
  const list = await getRequests()
  const entry: RequestItem = {
    id: String(Date.now()) + "-" + Math.floor(Math.random() * 10000),
    role: item.role ?? "unknown",
    type: item.type ?? "report",
    subject: item.subject ?? "",
    description: item.description,
    vehicleId: item.vehicleId,
    amount: typeof item.amount === "number" ? item.amount : undefined,
    preferredDate: item.preferredDate,
    createdAt: new Date().toISOString(),
  }
  list.unshift(entry)
  try {
    await ensureDataDir()
    await fs.writeFile(FILE, JSON.stringify(list, null, 2), "utf-8")
  } catch {
    /* ignore write errors */
  }
  return entry
}
