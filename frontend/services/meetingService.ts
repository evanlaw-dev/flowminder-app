// src/services/meetings.ts
import zoomSdk from "@zoom/appssdk";
import { useMeetingStore } from "../stores/useMeetingStore";
import { BACKEND_URL } from "../config/constants";

/** One-time Zoom config */
let zoomConfigured = false;
async function ensureZoomConfigured() {
  if (!zoomConfigured) {
    await zoomSdk.config({ capabilities: ["getMeetingContext", "getUserContext"] });
    zoomConfigured = true;
  }
}

export type GetOrCreatePayload = {
  zoom_meeting_id: string | number;
  host_email?: string | null;
  meeting_title?: string | null;
  scheduled_start?: string | Date | null;
};

export type GetOrCreateResponse = {
  success: boolean;
  meeting_id?: string;
  created?: boolean;
  error?: string;
};

export async function initMeetingInfo() {
  await ensureZoomConfigured();

  const [meetingCtx, userCtx] = await Promise.all([
    zoomSdk.getMeetingContext?.(),
    zoomSdk.getUserContext?.(),
  ]);

  const { meeting_id, created } = await getOrCreateMeeting({
    zoom_meeting_id: meetingCtx?.meetingID ?? "",
    host_email: null,
    meeting_title: meetingCtx?.meetingTopic ?? null,
    scheduled_start: new Date(),
  });

  console.log(
    `[Zoom Apps] meetingID=${meetingCtx?.meetingID} | meetingUUID=${meeting_id} | meetingTopic=${meetingCtx?.meetingTopic} | created=${created}`
  );
  console.log(
    `[Zoom Apps] user screenName=${userCtx?.screenName} | participantId=${userCtx?.participantUUID} | role=${userCtx?.role} | status=${userCtx?.status}`
  );

  useMeetingStore.getState().set({
    meetingId: meeting_id ?? null,
    topic: meetingCtx?.meetingTopic ?? null,
    isHost: (userCtx?.role ?? "").toLowerCase() === "host",
    screenName: userCtx?.screenName ?? null,
    role: userCtx?.role ?? null,
    status: userCtx?.status ?? null,
    authorized: userCtx?.status === "authorized",
  });

  try {
    await fetch("/api/meeting", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(useMeetingStore.getState()),
    });
  } catch {}
}

function toIsoOrNull(v: unknown) {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

async function getOrCreateMeeting(
  payload: GetOrCreatePayload,
  opts: { signal?: AbortSignal } = {}
): Promise<{ meeting_id: string; created: boolean }> {
  const body = {
    zoom_meeting_id: String(payload.zoom_meeting_id),
    host_email: payload.host_email ?? null,
    meeting_title: payload.meeting_title ?? null,
    scheduled_start: toIsoOrNull(payload.scheduled_start),
  };

  const res = await fetch(`${BACKEND_URL}/meetings/get_or_create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: 'omit',
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  const data: GetOrCreateResponse = await res.json();

  if (!res.ok || !data.success || data.meeting_id == null || data.created == null) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return { meeting_id: data.meeting_id, created: data.created };
}
