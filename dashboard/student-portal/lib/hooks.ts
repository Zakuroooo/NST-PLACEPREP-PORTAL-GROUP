/**
 * dashboard/student-portal/lib/hooks.ts
 * SWR-based data hooks for the student portal.
 * All hooks auto-revalidate on focus, deduplicate concurrent requests,
 * and return consistent { data, error, isLoading } shapes.
 *
 * Usage:
 *   const { data, isLoading, error } = useDashboard();
 */

import useSWR, { mutate as globalMutate } from 'swr';

// ── Fetcher ────────────────────────────────────────────────────────────────
const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err?.error?.message ?? 'Request failed');
  }
  const json = await res.json();
  return json.data ?? json;
};

// ── Mutations ──────────────────────────────────────────────────────────────
export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...((options.headers as object) || {}) },
    ...options,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error?.message ?? 'Request failed');
  }
  return (json.data ?? json) as T;
}

// ── Dashboard ──────────────────────────────────────────────────────────────
export function useDashboard() {
  const { data, error, isLoading } = useSWR('/api/dashboard', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5_000, // reduced from 30s so roadmap additions are reflected quickly
  });
  return { data, error, isLoading };
}

// ── Profile ────────────────────────────────────────────────────────────────
export function useProfile() {
  const { data, error, isLoading, mutate } = useSWR('/api/user/me', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
  return { data, error, isLoading, mutate };
}

export async function updateProfile(updates: Record<string, unknown>) {
  const result = await apiFetch('/api/user/me', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  await globalMutate('/api/user/me');
  return result;
}

export async function resetOnboarding() {
  const result = await apiFetch('/api/user/me/onboarding/reset', { method: 'POST' });
  await globalMutate('/api/user/me');
  return result;
}

export async function resetRoadmap() {
  const result = await apiFetch('/api/user/me/roadmap/reset', { method: 'POST' });
  await globalMutate('/api/user/me/roadmap');
  return result;
}

// ── Roadmap ────────────────────────────────────────────────────────────────
export function useRoadmap() {
  return useSWR('/api/user/me/roadmap', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
}

export async function addRoadmapCompany(data: { companySlug: string; targetRole: string; preparationWeeks: number }) {
  const result = await apiFetch('/api/user/me/roadmap', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  // Revalidate both roadmap AND dashboard so the new company is instantly visible
  // on the home page without requiring a manual page refresh.
  await Promise.all([
    globalMutate('/api/user/me/roadmap'),
    globalMutate('/api/dashboard'),
  ]);
  return result;
}

// ── Progress ───────────────────────────────────────────────────────────────
export function useProgress() {
  return useSWR('/api/progress', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
}

// ── Notifications ──────────────────────────────────────────────────────────
export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR('/api/notifications', fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 30_000, // poll every 30s for new notifications
    dedupingInterval: 15_000,
  });
  return { data, error, isLoading, mutate };
}

export async function markNotificationRead(id: string) {
  await apiFetch(`/api/notifications/${id}`, { method: 'PATCH' });
  await globalMutate('/api/notifications');
}

export async function markAllNotificationsRead() {
  await apiFetch('/api/notifications/read-all', { method: 'POST' });
  await globalMutate('/api/notifications');
}

// ── Doubts ─────────────────────────────────────────────────────────────────
export function useDoubts() {
  return useSWR('/api/doubts', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 30_000,
  });
}

export async function createDoubt(data: {
  subject: string;
  body: string;
  tag: string;
  assignedFacultyId?: string;
}) {
  const result = await apiFetch('/api/doubts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  await globalMutate('/api/doubts');
  return result;
}

export async function resolveDoubt(id: string) {
  // BUG-F FIX: Call API first, then revalidate. The calling page handles
  // optimistic local state; globalMutate here triggers a re-fetch that can
  // race and overwrite the optimistic update. Delay revalidation until after
  // the API confirms success to prevent flicker.
  const result = await apiFetch(`/api/doubts/${id}/resolve`, { method: 'PATCH' });
  // Revalidate after success so the list stays fresh without causing a flash
  await globalMutate('/api/doubts');
  return result;
}

// ── Sessions ───────────────────────────────────────────────────────────────
export function useSessions() {
  return useSWR('/api/sessions', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 30_000,
  });
}

export async function bookSession(data: {
  facultyId: string;
  topic: string;
  notes?: string;
  requestedDate: string;
  requestedTime: string;
  durationMin?: number;
}) {
  const result = await apiFetch('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  await globalMutate('/api/sessions');
  return result;
}

export async function updateSessionStatus(id: string, action: 'accept_proposal' | 'cancel') {
  const result = await apiFetch(`/api/sessions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  });
  await globalMutate('/api/sessions');
  return result;
}

// ── Experiences ─────────────────────────────────────────────────────────────
export function useExperiences() {
  return useSWR('/api/experiences', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 30_000,
  });
}

export async function submitExperience(data: Record<string, unknown>) {
  const result = await apiFetch('/api/experiences', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  await globalMutate('/api/experiences');
  return result;
}

// ── Leaderboard ─────────────────────────────────────────────────────────────
export function useLeaderboard(options?: { batch?: string; period?: string }) {
  const params = new URLSearchParams();
  if (options?.batch) params.set('batch', options.batch);
  if (options?.period) params.set('period', options.period);
  const qs = params.toString();
  const key = qs ? `/api/leaderboard?${qs}` : '/api/leaderboard';
  return useSWR(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
}

// ── Companies ───────────────────────────────────────────────────────────────
export function useCompanies() {
  return useSWR('/api/companies', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300_000, // company list rarely changes
  });
}

export function useCompany(slug: string | null) {
  return useSWR(slug ? `/api/companies/${slug}` : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300_000,
  });
}

// ── Practice ───────────────────────────────────────────────────────────────
export function usePractice(filters: {
  topic?: string;
  difficulty?: string;
  company?: string;
  roundType?: string;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (filters.topic) qs.append("topic", filters.topic);
  if (filters.difficulty) qs.append("difficulty", filters.difficulty);
  if (filters.company) qs.append("company", filters.company);
  if (filters.roundType) qs.append("roundType", filters.roundType);
  if (filters.page) qs.append("page", String(filters.page));
  if (filters.limit) qs.append("limit", String(filters.limit));

  return useSWR(`/api/practice?${qs.toString()}`, fetcher);
}

export function useTopics() {
  return useSWR('/api/topics', fetcher);
}

export function usePracticeStats() {
  return useSWR('/api/practice/stats', fetcher);
}

export async function completeQuestion(questionId: string, roadmapId?: string) {
  const result = await apiFetch(`/api/questions/${questionId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ roadmapId }),
  });
  // Revalidate progress + roadmap after completion
  await Promise.all([
    globalMutate('/api/progress'),
    globalMutate('/api/user/me/roadmap'),
    globalMutate('/api/dashboard'),
  ]);
  return result;
}

// ── Change Password ────────────────────────────────────────────────────────
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  return apiFetch('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── Complete Onboarding ────────────────────────────────────────────────────
export async function submitOnboarding(data: {
  targetDomains: string[];
  targetCategories: string[];
  topicSelfRatings: Record<string, number>;
  targetCompanySlugs: string[];
  prepWeeksCommitted: number;
}) {
  return apiFetch('/api/user/me/onboarding', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
