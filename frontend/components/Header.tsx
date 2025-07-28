import { useAgendaStore } from '@/stores/useAgendaStore';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import BtnAddTimerForCurrentItem from './BtnAddTimerForCurrentItem';

export default function Header() {
    const placeholder = `No items to display.`;
    const { getCurrentItem, getVisibleItems, nextItem, changeItemTimer, isEditingMode } = useAgendaStore();
    const [timerInput, setTimerInput] = useState('');
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);

    const currentItem = getCurrentItem();
    const visibleItems = getVisibleItems();

    const formatTimer = (seconds: number) => {
        if (seconds === 0) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Timer countdown effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        
        if (isTimerRunning && remainingTime > 0) {
            interval = setInterval(() => {
                setRemainingTime(prev => {
                    if (prev <= 1) {
                        setIsTimerRunning(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTimerRunning, remainingTime]);

    // Start timer when current item changes
    useEffect(() => {
        if (currentItem && currentItem.newTimerValue > 0) {
            setRemainingTime(currentItem.newTimerValue);
            setIsTimerRunning(false); // Reset timer state
        } else {
            setRemainingTime(0);
            setIsTimerRunning(false);
        }
    }, [currentItem]);

    const startTimer = () => {
        if (remainingTime > 0) {
            setIsTimerRunning(true);
        }
    };

    const pauseTimer = () => {
        setIsTimerRunning(false);
    };

    const resetTimer = () => {
        setIsTimerRunning(false);
        if (currentItem) {
            setRemainingTime(currentItem.newTimerValue);
        }
    };

    const parseTimerInput = (input: string): number => {
        if (!input.trim()) return 0;
        if (/^\d+$/.test(input)) return parseInt(input, 10);
        const timeMatch = input.match(/^(\d+):(\d{1,2})$/);
        if (timeMatch) return parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10);
        const naturalMatch = input.match(/^(\d+)([mhs])$/i);
        if (naturalMatch) {
            const value = parseInt(naturalMatch[1], 10);
            const unit = naturalMatch[2].toLowerCase();
            switch (unit) {
                case 'h': return value * 3600;
                case 'm': return value * 60;
                case 's': return value;
                default: return 0;
            }
        }
        const combinedMatch = input.match(/^(\d+)m(\d+)s$/i);
        if (combinedMatch) return parseInt(combinedMatch[1], 10) * 60 + parseInt(combinedMatch[2], 10);
        const numValue = parseInt(input, 10);
        return isNaN(numValue) ? 0 : numValue;
    };

    const handleTimerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        setTimerInput(inputValue);
    };

    const handleTimerBlur = () => {
        const parsedValue = parseTimerInput(timerInput);
        if (currentItem) {
            changeItemTimer(currentItem.id, parsedValue);
        }
        setTimerInput('');
    };

    const handleTimerIncrement = (increment: number) => {
        if (currentItem) {
            const currentValue = currentItem.newTimerValue;
            const newValue = Math.max(0, currentValue + (increment * 60));
            changeItemTimer(currentItem.id, newValue);
        }
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
                            {isEditingMode ? ( // Conditional rendering for editing
                                <div className="flex items-center gap-1">
                                    <input
                                        type="text"
                                        className="w-28 p-2 text-sm text-black rounded border focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={timerInput || formatTimer(currentItem.newTimerValue)}
                                        onChange={handleTimerChange}
                                        onBlur={handleTimerBlur}
                                        placeholder="0:00"
                                        title="Enter time as: 5m, 2:30, 1h, or 90s"
                                    />
                                    <div className="flex flex-col">
                                        <button onClick={() => handleTimerIncrement(1)} title="Add 1 minute">▲</button>
                                        <button onClick={() => handleTimerIncrement(-1)} title="Subtract 1 minute">▼</button>
                                    </div>
                                </div>
                            ) : (
                                currentItem.newTimerValue > 0 && (
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm">Timer: {formatTimer(remainingTime)}</p>
                                        <div className="flex gap-1">
                                            {!isTimerRunning ? (
                                                <button
                                                    onClick={startTimer}
                                                    className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                                    title="Start timer"
                                                >
                                                    ▶
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={pauseTimer}
                                                    className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                                    title="Pause timer"
                                                >
                                                    ⏸
                                                </button>
                                            )}
                                            <button
                                                onClick={resetTimer}
                                                className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                                title="Reset timer"
                                            >
                                                ↺
                                            </button>
                                        </div>
                                    </div>
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