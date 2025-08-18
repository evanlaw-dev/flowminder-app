let _MEETING_ID: string | null = null;
let _CURRENT_USER_ID: string | null = null;

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

export function getMeetingId() {
  return _MEETING_ID;
}
export function setMeetingId(id: string | null) {
  _MEETING_ID = id ?? null;
  if (process.env.NODE_ENV !== "production") {
    console.log("[constants] meeting id set:", _MEETING_ID);
  }
}
export function getCurrentUserId() {
  return _CURRENT_USER_ID;
}
export function setCurrentUserId(id: string | null) {
  _CURRENT_USER_ID = id ?? null;
  if (process.env.NODE_ENV !== "production") {
    console.log("[constants] user id set:", _CURRENT_USER_ID);
  }
}

// Helper to upsert the meeting row in DB via your backend route.
export async function syncMeetingToBackend(
  meetingId: string | null,
  userId: string | null
) {
  if (!meetingId) return null;
  const res = await fetch(`${BACKEND_URL}/update-meeting`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meetingId, userId }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.error("[constants] update-meeting failed:", res.status, t);
    return null;
  }
  return (await res.json().catch(() => ({}))) as { meetingRowId?: string };
}