"use client";

/**
 * Tiny localStorage shim that lets like/save/follow toggles persist across
 * refresh on the seed/mock fixtures (whose ids aren't real Supabase uuids).
 * Real DB rows always go through the server action — this only fires when
 * `isPersisted` is false. The price is that "fake" engagement on seed
 * items only lives in this one browser, which is exactly what we want.
 */

const STORAGE_KEY = "moidello_local_engagement_v1";

interface LocalEngagement {
  likes: Record<string, boolean>;
  saves: Record<string, boolean>;
  follows: Record<string, boolean>;
}

const empty: LocalEngagement = { likes: {}, saves: {}, follows: {} };

function read(): LocalEngagement {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...empty };
    const parsed = JSON.parse(raw) as Partial<LocalEngagement>;
    return {
      likes: parsed.likes ?? {},
      saves: parsed.saves ?? {},
      follows: parsed.follows ?? {},
    };
  } catch {
    return { ...empty };
  }
}

function write(state: LocalEngagement) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded or storage disabled — best-effort, ignore.
  }
}

export function getLocalLike(id: string): boolean {
  return !!read().likes[id];
}

export function setLocalLike(id: string, value: boolean): void {
  const s = read();
  if (value) s.likes[id] = true;
  else delete s.likes[id];
  write(s);
}

export function getLocalSave(id: string): boolean {
  return !!read().saves[id];
}

export function setLocalSave(id: string, value: boolean): void {
  const s = read();
  if (value) s.saves[id] = true;
  else delete s.saves[id];
  write(s);
}

export function getLocalFollow(userId: string): boolean {
  return !!read().follows[userId];
}

export function setLocalFollow(userId: string, value: boolean): void {
  const s = read();
  if (value) s.follows[userId] = true;
  else delete s.follows[userId];
  write(s);
}
