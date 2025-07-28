import { useAgendaStore } from '@/stores/useAgendaStore';
import React, { useState } from 'react';
import Image from 'next/image';
import BtnAddTimerForCurrentItem from './BtnAddTimerForCurrentItem';

export default function Header() {
    const placeholder = `No items to display.`;
    const { getCurrentItem, getVisibleItems, nextItem, changeItemTimer, isEditingMode } = useAgendaStore();
    const [timerInput, setTimerInput] = useState('');

    const currentItem = getCurrentItem();
    const visibleItems = getVisibleItems();

    const formatTimer = (seconds: number) => {
        if (seconds === 0) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const parseTimerInput = (input: string): number => {
        // Handle empty input
        if (!input.trim()) return 0;
        
        // Handle pure numbers (seconds)
        if (/^\d+$/.test(input)) {
            return parseInt(input, 10);
        }
        
        // Handle MM:SS format
        const timeMatch = input.match(/^(\d+):(\d{1,2})$/);
        if (timeMatch) {
            const minutes = parseInt(timeMatch[1], 10);
            const seconds = parseInt(timeMatch[2], 10);
            return minutes * 60 + seconds;
        }
        
        // Handle natural language (e.g., "5m", "2m30s", "1h")
        const naturalMatch = input.match(/^(\d+)([mhs])$/i);
        if (naturalMatch) {
            const value = parseInt(naturalMatch[1], 10);
            const unit = naturalMatch[2].toLowerCase();
            
            switch (unit) {
                case 'h': return value * 3600; // hours to seconds
                case 'm': return value * 60;   // minutes to seconds
                case 's': return value;        // seconds
                default: return 0;
            }
        }
        
        // Handle combined format (e.g., "2m30s")
        const combinedMatch = input.match(/^(\d+)m(\d+)s$/i);
        if (combinedMatch) {
            const minutes = parseInt(combinedMatch[1], 10);
            const seconds = parseInt(combinedMatch[2], 10);
            return minutes * 60 + seconds;
        }
        
        // If no pattern matches, try to parse as number
        const numValue = parseInt(input, 10);
        return isNaN(numValue) ? 0 : numValue;
    };

    const handleTimerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        setTimerInput(inputValue);
        
        // Parse and update timer value
        const parsedValue = parseTimerInput(inputValue);
        if (currentItem) {
            changeItemTimer(currentItem.id, parsedValue);
        }
    };

    const handleTimerIncrement = (increment: number) => {
        if (!currentItem) return;
        const currentValue = currentItem.newTimerValue;
        const newValue = Math.max(0, currentValue + (increment * 60)); // Increment by minutes
        changeItemTimer(currentItem.id, newValue);
        setTimerInput(formatTimer(newValue));
    };

    return (
        <div className="relative w-[80%] bg-stone-700/95 rounded-lg shadow-md text-center p-4">
            <div className="flex flex-col text-white">
                {/* render placeholder if there are is no agenda item to render */}
                {currentItem ? (
                    <>
                        <h1 className="text-lg font-semibold">{currentItem.text}</h1>

                        {/* Timer section */}
                        <div className="mt-2 flex items-center justify-center gap-2">
                            {/* Timer display or input */}
                            {isEditingMode ? (
                                <div className="flex items-center gap-1">
                                    <input
                                        type="text"
                                        className="w-20 p-1 text-sm text-black rounded border focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={timerInput || formatTimer(currentItem.newTimerValue)}
                                        onChange={handleTimerChange}
                                        placeholder="0:00"
                                        title="Enter time as: 5m, 2:30, 1h, or 90s"
                                    />
                                    <div className="flex flex-col">
                                        <button
                                            type="button"
                                            onClick={() => handleTimerIncrement(1)}
                                            className="px-1 py-0.5 border border-gray-300 text-xs hover:bg-gray-100 text-black"
                                            title="Add 1 minute"
                                        >
                                            ▲
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleTimerIncrement(-1)}
                                            className="px-1 py-0.5 border border-gray-300 border-t-0 text-xs hover:bg-gray-100 text-black"
                                            title="Subtract 1 minute"
                                        >
                                            ▼
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                currentItem.newTimerValue > 0 && (
                                    <p className="text-sm">Timer: {formatTimer(currentItem.newTimerValue)}</p>
                                )
                            )}
                            
                            {/* Add Timer Button */}
                            <BtnAddTimerForCurrentItem />
                        </div>
                    </>
                ) : (
                    <h1 className="text-lg font-semibold">{placeholder}</h1>
                )}
            </div>

            {visibleItems.length > 0 && (
                <>
                    <button
                        onClick={nextItem}
                        className="group absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 cursor-pointer"
                    >
                        <Image
                            src="/arrow-right-solid-full.svg"
                            alt="Next"
                            width={24}
                            height={24}
                            className="w-full h-full"
                        />
                        {/* tooltip on hover */}
                        <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-white bg-red-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Next Item
                        </span>
                    </button>
                </>
            )}
        </div>
    );
};