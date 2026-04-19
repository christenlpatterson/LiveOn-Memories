import type { Milestone, Photo, Comment, Annotation, AudioClip } from '../data/types';

export interface PhotoIntakeEntry {
  filename: string;
  url: string;
  year: string;
  notes: string;
  updatedAt: string;
}

// In dev, Vite proxies /api and /media to http://localhost:5000.
// In production, set VITE_API_BASE to the deployed backend origin.
const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${BASE}${path}`, init);
  if (!r.ok) {
    const msg = await r.text().catch(() => r.statusText);
    throw new Error(`API ${init?.method ?? 'GET'} ${path} → ${r.status}: ${msg}`);
  }
  if (r.status === 204) return undefined as T;
  return r.json();
}

// ── Milestones ────────────────────────────────────────────────────────────────

export function getMilestones(): Promise<Milestone[]> {
  return req('/api/milestones');
}

export function getMilestone(id: string): Promise<Milestone> {
  return req(`/api/milestones/${id}`);
}

export function createMilestone(data: {
  year: number;
  title: string;
  date: string;
  description: string;
  story: string;
}): Promise<Milestone> {
  return req('/api/milestones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function deleteMilestone(id: string): Promise<void> {
  return req(`/api/milestones/${id}`, { method: 'DELETE' });
}

export function updateMilestone(id: string, data: {
  year?: number;
  title?: string;
  date?: string;
  description?: string;
  story?: string;
}): Promise<Milestone> {
  return req(`/api/milestones/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// ── Photos ────────────────────────────────────────────────────────────────────

export function uploadPhoto(milestoneId: string, file: File, caption?: string): Promise<Photo> {
  const fd = new FormData();
  fd.append('file', file);
  if (caption) fd.append('caption', caption);
  return req(`/api/milestones/${milestoneId}/photos`, { method: 'POST', body: fd });
}

export function deletePhoto(milestoneId: string, photoId: string): Promise<void> {
  return req(`/api/milestones/${milestoneId}/photos/${photoId}`, { method: 'DELETE' });
}

// ── Annotations ───────────────────────────────────────────────────────────────

export function addAnnotation(
  milestoneId: string,
  photoId: string,
  x: number, y: number,
  text: string,
  author: string,
): Promise<Annotation> {
  return req(`/api/milestones/${milestoneId}/photos/${photoId}/annotations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ x, y, text, author }),
  });
}

// ── Comments ──────────────────────────────────────────────────────────────────

export function addComment(milestoneId: string, author: string, text: string): Promise<Comment> {
  return req(`/api/milestones/${milestoneId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author, text }),
  });
}

export function deleteComment(milestoneId: string, commentId: string): Promise<void> {
  return req(`/api/milestones/${milestoneId}/comments/${commentId}`, { method: 'DELETE' });
}

// ── Audio clips ───────────────────────────────────────────────────────────────

export function uploadAudio(milestoneId: string, blob: Blob): Promise<AudioClip> {
  const fd = new FormData();
  const ext = blob.type.includes('mp4') || blob.type.includes('aac') ? 'mp4' : 'webm';
  fd.append('file', blob, `recording.${ext}`);
  return req(`/api/milestones/${milestoneId}/audio`, { method: 'POST', body: fd });
}

export function deleteAudioClip(milestoneId: string, clipId: string): Promise<void> {
  return req(`/api/milestones/${milestoneId}/audio/${clipId}`, { method: 'DELETE' });
}

// ── Photo intake ──────────────────────────────────────────────────────────────

export function getPhotoIntakeEntries(): Promise<PhotoIntakeEntry[]> {
  return req('/api/photo-intake');
}

export function savePhotoIntakeEntry(
  filename: string,
  payload: { year: string; notes: string },
): Promise<PhotoIntakeEntry> {
  return req(`/api/photo-intake/${encodeURIComponent(filename)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
