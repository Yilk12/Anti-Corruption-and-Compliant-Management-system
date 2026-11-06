import { promises as fs } from "fs"
import path from "path"

type Ad = {
  id: string
  title: string
  content: string
  creator?: string
  createdAt: string
}

const DATA_DIR = path.join(process.cwd(), "data")
const FILE = path.join(DATA_DIR, "ads.json")

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch {
    /* ignore */
  }
}

export async function getAds(): Promise<Ad[]> {
  try {
    await ensureDataDir()
    const raw = await fs.readFile(FILE, "utf-8")
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as Ad[]
    return []
  } catch {
    return []
  }
}

export async function addAd(item: Partial<Ad>): Promise<Ad> {
  const list = await getAds()
  const entry: Ad = {
    id: String(Date.now()) + "-" + Math.floor(Math.random() * 10000),
    title: String(item.title || "Untitled"),
    content: String(item.content || ""),
    creator: item.creator ? String(item.creator) : undefined,
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
