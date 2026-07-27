/**
 * dashboard/admin-portal/lib/hooks.ts
 * SWR hooks — wired to real API endpoints.
 */

import useSWR from "swr";
import type { Student, Faculty } from "./types";

// ─── Generic JSON fetcher ────────────────────────────────────────
const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
};

// ─── Overview ────────────────────────────────────────────────────
export function useOverviewData() {
  const { data, error, isLoading } = useSWR(
    "/api/admin/overview",
    fetcher,
    {
      refreshInterval: 30_000,
      onError: () => {}, // suppress console noise; fallback handled below
    }
  );

  return {
    data: data ?? (error ? undefined : undefined),
    isLoading: isLoading && !error,
    isError: !!error,
  };
}

// ─── Students ────────────────────────────────────────────────────
export function useStudents(page = 1, limit = 10, search = "", batch = "") {
  const batchParam = batch && batch !== "All" ? `&batch=${encodeURIComponent(batch)}` : "";
  const key = `/api/admin/students?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}${batchParam}`;
  const { data, error, isLoading, mutate } = useSWR(key, fetcher);

  let students: Student[] = [];
  let total = 0;

  if (data) {
    students = data.students ?? data.data ?? [];
    total = data.total ?? 0;
  }

  return { students, total, isLoading, isError: !!error, mutate };
}

// ─── Student Detail ──────────────────────────────────────────────
export function useStudent(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/admin/students/${id}` : null,
    fetcher
  );
  return { student: data, isLoading, isError: !!error, mutate };
}

// ─── Faculty ─────────────────────────────────────────────────────
export function useFaculty(page = 1, limit = 10, search = "") {
  const key = `/api/admin/faculty?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
  const { data, error, isLoading, mutate } = useSWR(key, fetcher);

  let faculty: Faculty[] = [];
  let total = 0;

  if (data) {
    faculty = data.faculty ?? data.data ?? [];
    total = data.total ?? 0;
  }

  return { faculty, total, isLoading, isError: !!error, mutate };
}

// ─── Analytics ───────────────────────────────────────────────────
export function useEngagementData(_range = "30d") {
  const { data, error, isLoading } = useSWR(
    `/api/admin/analytics/engagement?range=${_range}`,
    fetcher,
    { refreshInterval: 30_000 }
  );
  return { data: data ?? undefined, isLoading: isLoading && !error, isError: !!error };
}

export function useDoubtsData(_range = "monthly") {
  const { data, error, isLoading } = useSWR(
    `/api/admin/analytics/doubts?range=${_range}`,
    fetcher
  );
  return { data: data ?? undefined, isLoading: isLoading && !error, isError: !!error };
}

export function usePracticeData(_range = "30d") {
  const { data, error, isLoading } = useSWR(
    `/api/admin/analytics/practice?range=${_range}`,
    fetcher
  );
  return { data: data ?? undefined, isLoading: isLoading && !error, isError: !!error };
}

export function usePlacementData() {
  const { data, error, isLoading } = useSWR(
    "/api/admin/analytics/placement",
    fetcher
  );
  return { data: data ?? undefined, isLoading: isLoading && !error, isError: !!error };
}

// ─── Leaderboard ─────────────────────────────────────────────────
export function useLeaderboard(_batch = "all", _period = "monthly") {
  const { data, error, isLoading } = useSWR(
    `/api/admin/leaderboard?batch=${_batch}&period=${_period}`,
    fetcher
  );
  const entries = data?.entries ?? data ?? [];
  return { leaderboard: Array.isArray(entries) ? entries : [], isLoading: isLoading && !error, isError: !!error };
}

// ─── Bookings ────────────────────────────────────────────────────
export function useBookingsData(_range = "30d") {
  const { data, error, isLoading } = useSWR(
    `/api/admin/bookings/stats?range=${_range}`,
    fetcher
  );
  return { data: data ?? undefined, isLoading: isLoading && !error, isError: !!error };
}

// ─── Mutations ───────────────────────────────────────────────────

/** Update a student's profile (PATCH /api/admin/students/:id) */
export async function patchStudent(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/admin/students/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Create a new faculty account (POST /api/admin/faculty) */
export async function createFaculty(body: Record<string, unknown>) {
  const res = await fetch("/api/admin/faculty", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Deactivate a faculty member (DELETE /api/admin/faculty/:id) */
export async function deactivateFaculty(id: string) {
  const res = await fetch(`/api/admin/faculty/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Broadcast notification to users (POST /api/admin/notifications/send) */
export async function broadcastNotification(body: {
  targetRole: string;
  title: string;
  subtitle: string;
  type: string;
}) {
  const res = await fetch("/api/admin/notifications/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Reset a user's password (POST /api/admin/users/:id/reset-password) */
export async function resetUserPassword(userId: string) {
  const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Create a new user account (POST /api/admin/users/create) */
export async function createUser(body: {
  email: string;
  role: string;
  fullName: string;
}) {
  const res = await fetch("/api/admin/users/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
