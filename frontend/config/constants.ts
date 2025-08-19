let _MEETING_ID: string | null = null;
let _CURRENT_USER_ID: string | null = null;

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

export function getMeetingId() {
  return _MEETING_ID;
}
export function setMeetingId(id: string | null) {
  console.log("managed to set: " + _MEETING_ID);
  _MEETING_ID = id ?? null;
}
export function getCurrentUserId() {
  return _CURRENT_USER_ID;
}
export function setCurrentUserId(id: string | null) {
  _CURRENT_USER_ID = id ?? null;
}

// Helper to upsert a meeting by Zoom ID via your backend route.
// 
async function syncMeetingToBackend(meetingId: string | null) {
  if (!meetingId) return null;
  console.log(meetingId + " from syncMeetingToBackend");
  const res = await fetch(
    `${BACKEND_URL}/meetings/zoom/${meetingId}`,
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

export async function syncAndSetMeeting(zoomMeetingId: string) {
  const result = await syncMeetingToBackend(zoomMeetingId);
  const canonical = result?.meetingRowId ?? null;
  if (canonical) setMeetingId(canonical);   // side effect lives here
  return canonical;                         // return canonical for React state, too
}
