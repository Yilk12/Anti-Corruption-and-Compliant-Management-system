import type { Complaint } from "@/backend/types/complaints";

// In-memory complaints store (prototype). Resets on server restart.
const store: { items: Complaint[] } = { items: [] };

export function listComplaints() {
  return store.items;
}

export function addComplaint(entry: Complaint) {
  store.items.unshift(entry);
  return entry;
}

export function getComplaint(id: string) {
  return store.items.find((i) => i.id === id) || null;
}

export function updateComplaint(id: string, patch: Partial<Complaint>) {
  const idx = store.items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  const updated = { ...store.items[idx], ...patch, updatedAt: new Date().toISOString() };
  store.items[idx] = updated as Complaint;
  return updated;
}
