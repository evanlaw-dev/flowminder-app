import { socket } from "./socket";
import { useAgendaStore } from "../stores/useAgendaStore";
import { MEETING_ID } from "../config/constants";

let wired = false;

export function initAgendaSockets() {
  if (wired) return;
  wired = true;

  socket.on("connect", () => {
    socket.emit("joinMeeting", MEETING_ID);
    socket.emit("agenda:get");
  });

  socket.on("agenda:snapshot", (s: any) => {
    useAgendaStore.getState().setAgendaItems(
      s.agenda.map((it: any) => ({
        id: it.id,
        text: it.text,
        originalText: it.text,
        isNew: false,
        isEdited: false,
        isDeleted: false,
        isProcessed: !!it.isProcessed,
        timerValue: it.timerValue ?? 0,
        originalTimerValue: it.timerValue ?? 0,
        isEditedTimer: false,
        processedAt: it.processedAt ?? null,
      }))
    );
  });

  socket.on("agenda:update", (patch: any) => {
    if (patch.agenda) {
      useAgendaStore.getState().setAgendaItems(
        patch.agenda.map((it: any) => ({
          id: it.id,
          text: it.text,
          originalText: it.text,
          isNew: false,
          isEdited: false,
          isDeleted: false,
          isProcessed: !!it.isProcessed,
          timerValue: it.timerValue ?? 0,
          originalTimerValue: it.timerValue ?? 0,
          isEditedTimer: false,
          processedAt: it.processedAt ?? null,
        }))
      );
    }
  });
}
