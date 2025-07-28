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
    timerValue: number;
    originalTimerValue: number;
    newTimerValue: number;
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
    toggleEditingMode: () => void;
    getCurrentItem: () => AgendaItemType | null;
    getVisibleItems: () => AgendaItemType[];
    hasUnsavedChanges: () => boolean;
};

export const useAgendaStore = create<AgendaStore>((set, get) => ({
    items: [],
    currentItemIndex: 0,
    showAllTimers: false,
    isEditingMode: false,

    loadItems: (items) =>
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
                newTimerValue: it.duration_seconds ?? it.timerValue ?? 0,
                isEditedTimer: false,
            })),
            currentItemIndex: 0,
        })),

    addItem: () =>
        set((state) => ({
            items: [
                ...state.items,
                {
                    id: uuid(),
                    text: '',
                    originalText: '',
                    isNew: true,
                    isEdited: false,
                    isDeleted: false,
                    isProcessed: false,
                    timerValue: 0,
                    originalTimerValue: 0,
                    newTimerValue: 0,
                    isEditedTimer: false,
                },
            ],
        })),

    changeItem: (id, text) =>
        set((state) => ({
            items: state.items.map((it) =>
                it.id === id
                    ? { ...it, text, isEdited: text !== it.originalText }
                    : it
            ),
        })),

    changeItemTimer: (id, timerValue) =>
        set((state) => ({
            items: state.items.map((it) =>
                it.id === id
                    ? { 
                        ...it, 
                        newTimerValue: timerValue, 
                        isEditedTimer: timerValue !== it.originalTimerValue 
                    }
                    : it
            ),
        })),

    removeItem: (id) =>
        set((state) => ({
            items: state.items.map((it) =>
                it.id === id ? { ...it, isDeleted: true } : it
            ),
        })),

    resetItems: () =>
        set((state) => ({
            items: state.items
                .filter((it) => !it.isNew)
                .map((it) => ({
                    ...it,
                    text: it.originalText,
                    newTimerValue: it.originalTimerValue,
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
                originalTimerValue: it.newTimerValue,
                timerValue: it.newTimerValue,
                newTimerValue: it.newTimerValue,
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

    getCurrentItem: () => {
        const { items } = get();
        const visibleItems = items.filter((it) => !it.isDeleted && !it.isProcessed);
        return visibleItems.length > 0 ? visibleItems[0] : null;
    },

    getVisibleItems: () => {
        const { items, showAllTimers } = get();
        let visibleItems = items.filter((it) => !it.isDeleted && !it.isProcessed);
        
        // If showing all timers, include the current item in the agenda list
        if (showAllTimers) {
            return visibleItems;
        }
        
        // Otherwise, exclude the current item (first item) from the agenda list
        return visibleItems.slice(1);
    },

    hasUnsavedChanges: () => {
        const { items } = get();
        return items.some((it) => it.isEdited || it.isEditedTimer || it.isNew);
    },
}));
