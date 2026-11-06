import type { VoiceboxEntry } from "@/backend/types/voicebox";

// Simple in-memory store. Data will reset on server restart.
const store: { items: VoiceboxEntry[] } = { items: [] };

export function listVoicebox() {
  return store.items;
}

export function getVoicebox(id: string) {
  return store.items.find((i) => i.id === id) || null;
}

export function addVoicebox(entry: VoiceboxEntry) {
  store.items.unshift(entry);
  return entry;
}

export function updateVoicebox(id: string, patch: Partial<VoiceboxEntry>) {
  const idx = store.items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  const updated = { ...store.items[idx], ...patch, updatedAt: new Date().toISOString() };
  store.items[idx] = updated;
  return updated;
}
