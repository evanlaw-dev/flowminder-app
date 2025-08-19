import { create } from "zustand";

export type ParticipantRow = {
  user_id: string;
  name: string;
  more: number;
  less: number;
  in_meeting: boolean;
};

type State = {
  byId: Record<string, ParticipantRow>;
  order: string[]; 
  replaceAll: (rows: ParticipantRow[]) => void;
  upsert: (row: ParticipantRow) => void;       
  mergeCounts: (userId: string, c: { more: number; less: number }) => void;
  showToast?: (m: string) => void;
  // Simple aggregate counters for guaranteed local updates
  moveAlongTotal: number;
  speakUpTotal: number;
  incrementMoveAlong: () => void;
  incrementSpeakUp: () => void;
};

export const useNudgeStore = create<State>((set) => ({
  byId: {},
  order: [],
  moveAlongTotal: 0,
  speakUpTotal: 0,
  replaceAll: (rows) =>
    set({
      byId: Object.fromEntries(rows.map((row) => [row.user_id, row])),
      order: rows.map((row) => row.user_id),
    }),
  upsert: (row) =>
    set((state) => ({
      byId: { ...state.byId, [row.user_id]: row },
      order: state.byId[row.user_id] ? state.order : [...state.order, row.user_id],
    })),
  mergeCounts: (userId, count) =>
    set((state) => {
      const cur = state.byId[userId];
      if (!cur) return {};
      return { byId: { ...state.byId, [userId]: { ...cur, more: count.more, less: count.less } } };
    }),
  incrementMoveAlong: () => set((s) => ({ moveAlongTotal: s.moveAlongTotal + 1 })),
  incrementSpeakUp: () => set((s) => ({ speakUpTotal: s.speakUpTotal + 1 })),
}));
