let _MEETING_ID: string | null = null;
let _CURRENT_USER_ID: string | null = null;

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

export function getMeetingId() {
  return _MEETING_ID;
}
export function setMeetingId(id: string | null) {
  _MEETING_ID = id ?? null;
  console.log("managed to set: " + _MEETING_ID);
}
export function getCurrentUserId() {
  return _CURRENT_USER_ID;
}
export function setCurrentUserId(id: string | null) {
  _CURRENT_USER_ID = id ?? null;
}

// Helper to upsert a meeting by Zoom ID via your backend route.
// 
export async function syncMeetingToBackend(meetingId: string | null) {
  if (!meetingId) return null;
  console.log(meetingId + " from synced");
  const res = await fetch(
    `${BACKEND_URL}/meetings/zoom/${encodeURIComponent(meetingId)}`,
    { method: "PUT", headers: { "Content-Type": "application/json" } }
  );
  console.log(res);
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.error("[constants] upsert meeting failed:", res.status, t);
    return null;
  }
  const m = await res.json().catch(() => null);
  return m ? ({ meetingRowId: m.id as string }) : null;
}
