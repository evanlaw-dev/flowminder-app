import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import { meetingId, syncProcessed } from '../services/agendaService';


function getStorageKey(meetingId: string) {
  return `processingStack_${meetingId}`;
}

function loadProcessingStack(meetingId: string): string[] {
  try {
    const stored = sessionStorage.getItem(getStorageKey(meetingId));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveProcessingStack(meetingId: string, stack: string[]) {
  sessionStorage.setItem(getStorageKey(meetingId), JSON.stringify(stack));
}

// Loads stack from sessionStorage on init
const processingStack: string[] = loadProcessingStack(meetingId);

const processingQueue = new Set<string>();
const processingUndoQueue = new Set<string>();
let debounceTimerProcess: ReturnType<typeof setTimeout> | null = null;
let debounceTimerUnprocess: ReturnType<typeof setTimeout> | null = null;

export interface AgendaItemType {
    id: string;
    text: string;
    originalText: string;
    isNew: boolean;
    isEdited: boolean;
    isDeleted: boolean;
    isProcessed: boolean;
    timerValue: number;
    originalTimerValue: number;
    isEditedTimer: boolean;
    processedAt?: string | null;  
}

type AgendaStore = {
    items: AgendaItemType[];
    currentItemIndex: number;
    showAllTimers: boolean;
    isEditingMode: boolean;
    loadItems: (items: { id: string; text: string; duration_seconds?: number; timerValue?: number; isProcessed?: boolean; }[]) => void;
    addItem: () => void;
    changeItem: (id: string, text: string) => void;
    changeItemTimer: (id: string, timerValue: number) => void;
    removeItem: (id: string) => void;
    resetItems: () => void;
    saveSuccess: (savedItems: AgendaItemType[]) => void;
    nextItem: () => void;
    previousItem: () => void;
    processCurrentItem: () => void;
    toggleAllTimers: () => void;
    setEditingMode: (flag: boolean) => void;
    toggleEditingMode: () => void;
    getCurrentItem: () => AgendaItemType | null;
    getVisibleItems: () => AgendaItemType[];
    hasUnsavedChanges: () => boolean;
    lastAddedItemId: string | null;
    clearLastAddedItemId: () => void;
};

export const useAgendaStore = create<AgendaStore>((set, get) => ({
    items: [],
    currentItemIndex: 0,
    showAllTimers: false,
    isEditingMode: false,
    lastAddedItemId: null,

    loadItems: (items) => {
        set(() => ({
            items: items.map((it) => ({
                ...it,
                originalText: it.text,
                isNew: false,
                isEdited: false,
                isDeleted: false,
                isProcessed: it.isProcessed ?? false,
                timerValue: it.duration_seconds ?? it.timerValue ?? 0,
                originalTimerValue: it.duration_seconds ?? it.timerValue ?? 0,
                isEditedTimer: false,
            })),
            currentItemIndex: 0,
        }));
    },

    addItem: () => {
        const newItemId = uuid();
        set((state) => ({
            items: [
                ...state.items,
                {
                    id: newItemId,
                    text: '',
                    originalText: '',
                    isNew: true,
                    isEdited: false,
                    isDeleted: false,
                    isProcessed: false,
                    timerValue: 0,
                    originalTimerValue: 0,
                    isEditedTimer: false,
                },
            ],
            lastAddedItemId: newItemId,
        }));
        setTimeout(() => {
            set({ lastAddedItemId: newItemId });
        }, 0);
    },

    changeItem: (id, text) =>
        set((state) => ({
            items: state.items.map((it) =>
                it.id === id
                    ? { ...it, text, isEdited: text.trim() !== it.originalText.trim() }
                    : it
            ),
        })),

    changeItemTimer: (id, timerValue) =>
        set((state) => ({
            items: state.items.map((it) =>
                it.id === id
                    ? {
                        ...it,
                        timerValue: timerValue,
                        isEditedTimer: timerValue !== it.originalTimerValue
                    }
                    : it
            ),
        })),

    removeItem: (id) =>
        set((state) => ({
            items: state.items.map((it) =>
                it.id === id ? { ...it, isDeleted: true, isProcessed: true } : it
            ),
        })),

    resetItems: () =>
        set((state) => ({
            items: state.items
                .filter((it) => !it.isNew)
                .map((it) => ({
                    ...it,
                    text: it.originalText,
                    timerValue: it.originalTimerValue,
                    isEdited: false,
                    isDeleted: false,
                    isEditedTimer: false,
                })),
        })),

    saveSuccess: (savedItems) =>
        set(() => ({
            items: savedItems.map((it) => ({
                ...it,
                originalText: it.text,
                originalTimerValue: it.timerValue,
                timerValue: it.timerValue,
                isNew: false,
                isEdited: false,
                isDeleted: false,
                isProcessed: it.isProcessed,
                isEditedTimer: false,
            })),
        })),

    nextItem: () => {
        const { items, currentItemIndex } = get();
        const visibleItems = items.filter(it => !it.isDeleted && !it.isProcessed);
        if (visibleItems.length === 0) return;

        const currentItemId = visibleItems[0].id;
        const now = new Date().toISOString();

        const updatedItems = items.map(it =>
            it.id === currentItemId
                ? { ...it, isProcessed: true, processedAt: now }
                : it
        );

        processingStack.push(currentItemId);
        saveProcessingStack(meetingId, processingStack);

        processingQueue.add(currentItemId);
        startDebounceSync(true, get);

        set({ items: updatedItems, currentItemIndex: currentItemIndex + 1 });
    },

    previousItem: () => {
        if (processingStack.length === 0) return;

        const lastProcessedId = processingStack.pop();
        if (!lastProcessedId) return;

        saveProcessingStack(meetingId, processingStack); 

        const updatedItems = get().items.map(it =>
            it.id === lastProcessedId
                ? { ...it, isProcessed: false, processedAt: null }
                : it
        );

        processingUndoQueue.add(lastProcessedId);
        startDebounceSync(false, get);

        set({ items: updatedItems });
    },

    processCurrentItem: () => {
        const { nextItem } = get();
        nextItem();
    },

    toggleAllTimers: () =>
        set((state) => ({
            showAllTimers: !state.showAllTimers,
            isEditingMode: !state.showAllTimers,
        })),

    toggleEditingMode: () =>
        set((state) => ({
            isEditingMode: !state.isEditingMode,
        })),

    setEditingMode: (flag: boolean) =>
        set(() => ({
            isEditingMode: flag,
        })),

    getCurrentItem: () => {
        const { items } = get();
        const visibleItems = items.filter((it) => !it.isDeleted && !it.isProcessed);
        return visibleItems.length > 0 ? visibleItems[0] : null;
    },

    getVisibleItems: () => {
        const { items, isEditingMode } = get();
        const visibleItems = items.filter((it) => !it.isDeleted && !it.isProcessed);

        if (isEditingMode) {
            return visibleItems;
        }

        return visibleItems.slice(1).filter((it) => it.text.trim() !== '');
    },

    hasUnsavedChanges: () => {
        const { items } = get();
        return items.some((it) => (it.isEdited || it.isEditedTimer || it.isDeleted) && !(it.isDeleted && it.isNew));
    },

    clearLastAddedItemId: () => set({ lastAddedItemId: null }),
}));

function startDebounceSync(isProcessing: boolean, get: () => AgendaStore) {
    const timerRef = isProcessing ? debounceTimerProcess : debounceTimerUnprocess;
    if (timerRef) clearTimeout(timerRef);

    const queue = isProcessing ? processingQueue : processingUndoQueue;

    const newTimer = setTimeout(async () => {
        if (queue.size === 0) return;

        const payload = Array.from(queue).map(id => {
            const item = get().items.find((it: AgendaItemType) => it.id === id);
            return {
                id,
                isProcessed: isProcessing,
                processedAt: isProcessing ? item?.processedAt : null,
            };
        });

        queue.clear();

        try {
            await syncProcessed(payload);
        } catch (err) {
            console.error('Failed to sync processed items:', err);
            payload.forEach(({ id }) => queue.add(id)); // retry on next run
        }
    }, 500);

    if (isProcessing) debounceTimerProcess = newTimer;
    else debounceTimerUnprocess = newTimer;
}
