import { useAgendaStore } from '@/stores/useAgendaStore';
import React from 'react';

export default function Header() {
    // const currentItemIndex = useAgendaStore(state => state.currentItemIndex);
    const placeholder = `No items to display.`;
    const items = useAgendaStore(state => state.items);
    const nextItem = useAgendaStore(state => state.nextItem);

    const visibleItems = React.useMemo(
        () => items.filter(it => !it.isDeleted && !it.isProcessed),
        [items]
    );

    const currentItem = visibleItems[0];  // Always take the first unprocessed item

    return (
        <div className="relative w-[80%] bg-stone-700/95 rounded-lg shadow-md text-center p-4">
            <div className="flex flex-col text-white">
                {/* render placeholder if there are is no agenda item to render */}
                {currentItem ? (
                    <>
                        <h1 className="text-lg font-semibold">{currentItem.text}</h1>

                        {/* render timer is value > 0 */}
                        {currentItem.timerValue > 0 && (
                            <p className="text-sm">Timer: {currentItem.timerValue}</p>
                        )}
                    </>
                ) : (
                    <h1 className="text-lg font-semibold">{placeholder}</h1>
                )}
            </div>


            {visibleItems.length > 0 && (
                <button
                    onClick={nextItem}
                    className="group absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 cursor-pointer"
                >
                    <img src='/arrow-right-solid-full.svg' alt="Next" className="w-full h-full" />
                    <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-white bg-red-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Next Item
                    </span>
                </button>

            )}
        </div>
    );
};


