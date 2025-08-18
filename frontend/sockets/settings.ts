// src/sockets/settings.ts
import { socket } from "./socket";
import { useAgendaStore, MeetingTimerSettings } from "@/stores/useAgendaStore";
import { getMeetingId } from "@/stores/useMeetingStore"; // tiny accessor

let wired = false;
const MEETING_ID = getMeetingId();

type SettingsUpdatePayload = {
  timer_settings: MeetingTimerSettings;  // <- precise shape
  serverTime?: number;
};

export function initSettingsSockets() {
  if (wired) return;
  wired = true;

  socket.emit("joinMeeting", MEETING_ID);

  socket.on(
    "settings:update",
    ({ timer_settings }: SettingsUpdatePayload) => {
      useAgendaStore.getState().applyTimerSettingsFromDb(timer_settings);
    }
  );
}
