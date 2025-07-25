import { useAgendaStore } from '@/stores/useAgendaStore';
import React from 'react';

export default function Header({ timer }: { timer: string }) {
    // const currentItemIndex = useAgendaStore(state => state.currentItemIndex);
    const placeholder = `You're done for today!`;
    const items = useAgendaStore(state => state.items);
    const nextItem = useAgendaStore(state => state.nextItem);

    const visibleItems = React.useMemo(
        () => items.filter(it => !it.isDeleted && !it.isProcessed),
        [items]
    );

    const currentItem = visibleItems[0];  // Always take the first unprocessed item

    return (
        <div className="flex items-center w-[80%] bg-stone-700/95 rounded-lg shadow-md text-center">
            <div className="flex flex-col text-white p-4 w-[70%]">
                {currentItem ? (
                    <h1 className="text-lg font-semibold">{currentItem.text}</h1>
                ) : (
                    <h1 className="text-lg font-semibold">{placeholder}</h1>
                )}
                <p className="text-sm">Timer: {timer}</p>
            </div>

            {visibleItems.length > 0 && (
                <button
                    onClick={nextItem}
                    className="w-[30%] flex justify-center items-center p-4"
                >
                    <img src='/arrow-right-solid-full.svg' alt="Next" className="w-6 h-6" />
                </button>
            )}
        </div>
    );
};
