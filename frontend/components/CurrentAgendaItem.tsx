'use client'
import { useState, useEffect } from 'react';

interface CurrentAgendaItemProps {
  currentItem?: {
    id: string;
    text: string;
    timer_value: number;
    is_running: boolean;
    initial_value: number;
  };
}

function CurrentAgendaItem({ currentItem }: CurrentAgendaItemProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Initialize timer when currentItem changes
  useEffect(() => {
    if (currentItem) {
      setTimeLeft(currentItem.timer_value);
      setIsRunning(currentItem.is_running);
    }
  }, [currentItem]);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            setIsRunning(false);
            // Play notification sound when timer ends
            if (typeof window !== 'undefined' && window.Notification && Notification.permission === 'granted') {
              new Notification('Timer Complete!', {
                body: `Timer for "${currentItem?.text || 'Agenda Item'}" has finished.`,
                icon: '/favicon.ico'
              });
            }
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, currentItem?.text]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = async () => {
    if (!currentItem) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/agenda/${currentItem.id}/timer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timer_value: timeLeft,
          is_running: true
        })
      });
      
      if (response.ok) {
        setIsRunning(true);
      }
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  const handlePauseTimer = async () => {
    if (!currentItem) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/agenda/${currentItem.id}/timer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timer_value: timeLeft,
          is_running: false
        })
      });
      
      if (response.ok) {
        setIsRunning(false);
      }
    } catch (error) {
      console.error('Error pausing timer:', error);
    }
  };

  const handleResetTimer = async () => {
    if (!currentItem) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/agenda/${currentItem.id}/timer/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setTimeLeft(currentItem.initial_value);
        setIsRunning(false);
      }
    } catch (error) {
      console.error('Error resetting timer:', error);
    }
  };

  const topic = currentItem?.text || 'No agenda item selected';
  const timerDisplay = formatTime(timeLeft);

  return (
    <div className="w-[80%] text-white bg-stone-700/95 p-4 rounded-lg shadow-md items-center text-center">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm">currently discussed: </h2>
        <h1 className="text-xl font-semibold">{topic}</h1>
        <div className="p-2 rounded-lg min-h-[2.5rem]">
          <h1 className="text-2xl font-bold">{timerDisplay}</h1>
        </div>
        {currentItem && (
          <div className="flex gap-2 justify-center mt-2">
            <button
              onClick={isRunning ? handlePauseTimer : handleStartTimer}
              className={`px-3 py-1 rounded text-sm font-semibold ${
                isRunning 
                  ? 'bg-yellow-600 hover:bg-yellow-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={handleResetTimer}
              className="px-3 py-1 rounded text-sm font-semibold bg-red-600 hover:bg-red-700"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CurrentAgendaItem; 