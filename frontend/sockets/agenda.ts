import { socket } from "./socket";
import { useAgendaStore, type AgendaItemType } from "../stores/useAgendaStore";
import { getMeetingId } from "../config/constants";

const MEETING_ID = getMeetingId();
let wired = false;

// Shapes coming from the server
type itemFromServer = {
  id: string;
  text: string;
  timerValue?: number | null;
  isProcessed?: boolean;
  processedAt?: string | null;
};

type SendSnapshot = { agenda: itemFromServer[] };
type SendUpdate = { agenda?: itemFromServer[] };

// Mapper: itemFromServer -> AgendaItemType
const toStoreItem = (it: itemFromServer): AgendaItemType => {
  const timer = it.timerValue ?? 0;
  return {
    id: it.id,
    text: it.text,
    originalText: it.text,
    isNew: false,
    isEdited: false,
    isDeleted: false,
    isProcessed: !!it.isProcessed,
    timerValue: timer,
    originalTimerValue: timer,
    isEditedTimer: false,
    processedAt: it.processedAt ?? null,
  };
};

export function initAgendaSockets(): void {
  if (wired) return;
  wired = true;

    const id = MEETING_ID ?? getMeetingId(); // read current value
    if (!id) {
      console.warn("[sockets] No meetingId available on connect; will wait.");
      return;
    }
    socket.emit("joinMeeting", { meetingId: id });
    socket.emit("agenda:get", { meetingId: id });

  socket.on("agenda:snapshot", (s: SendSnapshot) => {
    useAgendaStore.getState().setAgendaItems(s.agenda.map(toStoreItem));
  });

  socket.on("agenda:update", (patch: SendUpdate) => {
    if (!patch.agenda) return;
    useAgendaStore.getState().setAgendaItems(patch.agenda.map(toStoreItem));
  });
}
