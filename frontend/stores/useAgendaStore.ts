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
    isEditedTimer: boolean;
}

type AgendaStore = {
    items: AgendaItemType[];
    currentItemIndex: number;
    loadItems: (items: { id: string; text: string; timerValue?: number }[]) => void;
    addItem: () => void;
    changeItem: (id: string, text: string) => void;
    changeItemTimer: (id: string, timerValue: number) => void;
    removeItem: (id: string) => void;
    resetItems: () => void;
    saveSuccess: (savedItems: AgendaItemType[]) => void;
    nextItem: () => void;
    processCurrentItem: () => void;
};

export const useAgendaStore = create<AgendaStore>((set, get) => ({
    items: [],
    currentItemIndex: 0,

    loadItems: (items) =>
        set(() => ({
            items: items.map((it) => ({
                ...it,
                originalText: it.text,
                isNew: false,
                isEdited: false,
                isDeleted: false,
                isProcessed: false,
                timerValue: it.timerValue ?? 0,
                originalTimerValue: it.timerValue ?? 0,
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
                    ? { ...it, timerValue, isEditedTimer: timerValue !== it.originalTimerValue }
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
}));
