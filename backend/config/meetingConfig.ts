// meetingConfig.ts
import { readFileSync, writeFileSync } from 'fs';

type MeetingInfo = {
  meetingId?: string | null;
  topic?: string | null;
  isHost?: boolean;
  screenName?: string | null;
  role?: string | null;
  status?: string | null;
  authorized?: boolean;
};

let current: MeetingInfo = {};
try {
  current = JSON.parse(readFileSync('./meeting-config.json', 'utf8'));
} catch {}

export function getMeeting(): MeetingInfo { return current; }

export function setMeeting(next: MeetingInfo) {
  current = next;
  try { writeFileSync('./meeting-config.json', JSON.stringify(current, null, 2)); } catch {}
}
