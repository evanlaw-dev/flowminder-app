import { create } from 'zustand';
import { v4 as uuid } from 'uuid';

export interface AgendaItemType {
    id: string;
    text: string;
    originalText: string;
    isNew: boolean;
    isEdited: boolean;
    isDeleted: boolean;
    isProcessed: boolean;
    timerValue: number; // Current timer value (may be edited)
    originalTimerValue: number; // Original timer value before any edits, deletes
    isEditedTimer: boolean;
}

type AgendaStore = {
    items: AgendaItemType[];
    currentItemIndex: number;
    showAllTimers: boolean;
    isEditingMode: boolean;
    loadItems: (items: { id: string; text: string; duration_seconds?: number; timerValue?: number }[]) => void;
    addItem: () => void;
    changeItem: (id: string, text: string) => void;
    changeItemTimer: (id: string, timerValue: number) => void;
    removeItem: (id: string) => void;
    resetItems: () => void;
    saveSuccess: (savedItems: AgendaItemType[]) => void;
    nextItem: () => void;
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
                isProcessed: false,
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
            lastAddedItemId: newItemId,  // <-- Track it here
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
                isProcessed: false,
                isEditedTimer: false,
            })),
        })),

    nextItem: () => {
        const { items } = get();
        const visibleItems = items.filter((it) => !it.isDeleted && !it.isProcessed);
        if (visibleItems.length === 0) return; // No more items to process

        const currentItemId = visibleItems[0].id;
        const updatedItems = items.map((it) =>
            it.id === currentItemId ? { ...it, isProcessed: true } : it
        );

        set({ items: updatedItems });
    },

    processCurrentItem: () => {
        const { nextItem } = get();
        nextItem();
    },

    toggleAllTimers: () =>
        set((state) => ({
            showAllTimers: !state.showAllTimers,
            isEditingMode: !state.showAllTimers, // Enter editing mode when showing timers
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

        // if in editing mode, include the current item in the agenda list
        if (isEditingMode) {
            return visibleItems;
        }

        // Otherwise, exclude the current item (first item) from the agenda list
        return visibleItems.slice(1).filter((it) => it.text.trim() !== '');
    },

    // Changes are considered unsaved if an item has been edited or deleted, but not just added.
    hasUnsavedChanges: () => {
        const { items } = get();
        return items.some((it) => (it.isEdited || it.isEditedTimer || it.isDeleted) && !(it.isDeleted && it.isNew));
    },

    clearLastAddedItemId: () => set({ lastAddedItemId: null }),

}));
