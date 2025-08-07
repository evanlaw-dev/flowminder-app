import { useAgendaStore } from '@/stores/useAgendaStore';
import React, { useState, useEffect } from 'react';
import Timer from './Timer';
import Image from 'next/image';
import BtnAddTimerForCurrentItem from './BtnAddTimerForCurrentItem';

export default function Header({ role = "participant" }: { role?: "host" | "participant" }) {
    const placeholder = `No items to display.`;
    const { getCurrentItem, getVisibleItems, nextItem, changeItemTimer, isEditingMode } = useAgendaStore();
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);
    const [truncated, setTruncated] = useState(true);


    const currentItem = getCurrentItem();
    const visibleItems = getVisibleItems();


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
        if (currentItem && currentItem.timerValue > 0) {
            setRemainingTime(currentItem.timerValue);
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
            setRemainingTime(currentItem.timerValue);
        }
    };

    const handleClick = () => {
        setTruncated(prev => !prev);  // Toggle truncate/expand
    };

    // Timer input/edit logic is now handled by AgendaTimer

    return (
        <div className="relative flex-shrink-0 rounded-lg text-center py-4 px-12 break-words">
            <div className="flex flex-col text-white">
                {/* render placeholder if there are is no agenda item to render */}
                {currentItem ? (
                    <>
                        <h1 onClick={handleClick} className={`text-lg text-amber-400 font-semibold ${truncated ? 'line-clamp-3 lg:line-clamp-4' : ''}`}>{currentItem.text}</h1>

                        {/* Timer section */}
                        <div className="mt-2 flex items-center justify-center">
                            <div className="w-auto w-full flex items-center justify-center gap-2">
                                {isEditingMode ? (
                                    <Timer
                                        canEdit={true}
                                        timerValue={currentItem.timerValue}
                                        onChangeTimer={(newValue) => changeItemTimer(currentItem.id, newValue)}
                                    />
                                ) : (
                                    currentItem.timerValue > 0 && (
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm">Timer: {(() => {
                                                const minutes = Math.floor(remainingTime / 60);
                                                const seconds = remainingTime % 60;
                                                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                                            })()}</p>
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
                        </div>
                    </>
                ) : (
                    <h1 className="text-lg font-semibold">{placeholder}</h1>
                )}
            </div>

            {visibleItems.length > 0 && role === 'host' && (
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