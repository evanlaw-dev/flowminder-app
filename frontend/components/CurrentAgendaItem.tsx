'use client'
import { useState, useEffect } from 'react';

function CurrentAgendaItem() {
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes default
  const [isRunning, setIsRunning] = useState(false);
  const [topic, setTopic] = useState('Write user stories'); // Default topic
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [tempTopic, setTempTopic] = useState(topic);

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
                body: `Timer for "${topic}" has finished.`,
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
  }, [isRunning, timeLeft, topic]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    setIsRunning(true);
  };

  const handlePauseTimer = () => {
    setIsRunning(false);
  };

  const handleResetTimer = () => {
    setTimeLeft(900); // Reset to 15 minutes
    setIsRunning(false);
  };

  const handleSaveTopic = () => {
    setTopic(tempTopic);
    setIsEditingTopic(false);
  };

  const handleCancelEdit = () => {
    setTempTopic(topic);
    setIsEditingTopic(false);
  };

  const timerDisplay = formatTime(timeLeft);

  return (
    <div className="w-[80%] text-white bg-stone-700/95 p-4 rounded-lg shadow-md items-center text-center">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm">currently discussed: </h2>
        
        {/* Topic display/edit */}
        {isEditingTopic ? (
          <div className="flex gap-2 justify-center items-center">
            <input
              type="text"
              value={tempTopic}
              onChange={(e) => setTempTopic(e.target.value)}
              className="text-xl font-semibold bg-stone-600 px-2 py-1 rounded text-center flex-1"
              autoFocus
            />
            <button
              onClick={handleSaveTopic}
              className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
            >
              ✓
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
            >
              ✕
            </button>
          </div>
        ) : (
          <h1 
            className="text-xl font-semibold cursor-pointer hover:bg-stone-600/50 px-2 py-1 rounded"
            onClick={() => setIsEditingTopic(true)}
            title="Click to edit topic"
          >
            {topic}
          </h1>
        )}
        
        <div className="p-2 rounded-lg min-h-[2.5rem]">
          <h1 className="text-2xl font-bold">{timerDisplay}</h1>
        </div>
        
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
      </div>
    </div>
  );
}

export default CurrentAgendaItem; 