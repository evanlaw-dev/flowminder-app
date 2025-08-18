export let MEETING_ID = "";
export let CURRENT_USER_ID = "";

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export function setMeetingId(id: string) {
  MEETING_ID = id;
  console.log("frotnend meeting id from console" + MEETING_ID);
}

export function setCurrentUserId(id: string) {
  CURRENT_USER_ID = id;
  console.log("frotnend meeting id from console" + CURRENT_USER_ID);
}
