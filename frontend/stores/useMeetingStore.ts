// useMeetingStore.ts
import { create } from 'zustand';

export type MeetingInfo = {
  meetingId: string | null;
  topic: string | null;
  isHost: boolean;
  screenName: string | null;
  role: string | null;
  status: string | null;      // 'authorized' | 'unauthorized' | etc.
  authorized: boolean;        // derived from status
};

type State = MeetingInfo & {
  set: (partial: Partial<MeetingInfo>) => void;
};

export const useMeetingStore = create<State>((set) => ({
  meetingId: null,
  topic: null,
  isHost: false,
  screenName: null,
  role: null,
  status: null,
  authorized: false,
  set: (partial) => set((s) => ({ ...s, ...partial })),
}));

export const meetingState = {
  get: () => useMeetingStore.getState(),
};

export const getMeetingId = () => useMeetingStore.getState().meetingId;

