'use client'
import { useState, useEffect } from 'react';

interface CurrentAgendaItemProps {
  agendaItems?: Array<{
    id: string;
    text: string;
    originalText: string;
    isNew: boolean;
    isEdited: boolean;
    isDeleted: boolean;
    duration_seconds?: number;
  }>;
  currentItemIndex?: number;
  onNextItem?: () => void;
}

function CurrentAgendaItem({ agendaItems = [], currentItemIndex = 0, onNextItem }: CurrentAgendaItemProps) {
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes default
  const [isRunning, setIsRunning] = useState(false);
  const [topic, setTopic] = useState('Write user stories'); // Default topic
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [tempTopic, setTempTopic] = useState(topic);
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [tempHours, setTempHours] = useState(0);
  const [tempMinutes, setTempMinutes] = useState(15);
  const [tempSeconds, setTempSeconds] = useState(0);
  const [timerCompleted, setTimerCompleted] = useState(false);

  // Update topic and timer when agenda items or current index changes
  useEffect(() => {
    if (agendaItems.length > 0 && currentItemIndex < agendaItems.length) {
      const currentItem = agendaItems[currentItemIndex];
      if (currentItem && currentItem.text.trim()) {
        setTopic(currentItem.text);
        setTempTopic(currentItem.text);
        
        // Set timer to the duration specified for this agenda item
        const duration = currentItem.duration_seconds || 900; // Default to 15 minutes if not specified
        setTimeLeft(duration);
        
        // Reset timer state
        setIsRunning(false);
        setTimerCompleted(false);
      }
    }
  }, [agendaItems, currentItemIndex]);

  // Initialize temp timer values when editing starts
  useEffect(() => {
    console.log('useEffect triggered:', { isEditingTimer, timeLeft });
    if (isEditingTimer) {
      const hours = Math.floor(timeLeft / 3600);
      const minutes = Math.floor((timeLeft % 3600) / 60);
      const seconds = timeLeft % 60;
      console.log('Initializing timer edit values:', { timeLeft, hours, minutes, seconds });
      setTempHours(hours);
      setTempMinutes(minutes);
      setTempSeconds(seconds);
    }
  }, [isEditingTimer, timeLeft]);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            setIsRunning(false);
            setTimerCompleted(true);
            // Play notification sound when timer ends
            if (typeof window !== 'undefined' && window.Notification) {
              new Notification('Timer Complete!', {
                body: `Time's up for: ${topic}`,
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
  }, [isRunning, timeLeft]); // Removed 'topic' from dependencies to prevent timer restart

  // Format time for display
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    if (timeLeft > 0) {
      setIsRunning(!isRunning);
      setTimerCompleted(false);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    // Reset to the original duration from the agenda item
    const currentItem = agendaItems[currentItemIndex];
    const originalDuration = currentItem?.duration_seconds || 900; // Default to 15 minutes if not specified
    setTimeLeft(originalDuration);
    setTimerCompleted(false);
  };

  const handleTopicSave = () => {
    setTopic(tempTopic);
    setIsEditingTopic(false);
  };

  const handleTopicCancel = () => {
    setTempTopic(topic);
    setIsEditingTopic(false);
  };

  const handleTimerSave = () => {
    const newTimeLeft = tempHours * 3600 + tempMinutes * 60 + tempSeconds;
    console.log('Saving timer:', { tempHours, tempMinutes, tempSeconds, newTimeLeft });
    setTimeLeft(newTimeLeft);
    setIsRunning(false);
    setIsEditingTimer(false);
    setTimerCompleted(false);
  };

  const handleTimerCancel = () => {
    setIsEditingTimer(false);
  };

  const handleNextItem = () => {
    setTimerCompleted(false);
    setIsRunning(false);
    if (onNextItem) {
      onNextItem();
    }
  };

  // Check if there are more items in the agenda
  const hasNextItem = currentItemIndex < agendaItems.length - 1;
  const nextItemText = hasNextItem ? agendaItems[currentItemIndex + 1]?.text : '';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Debug info - remove this later */}
      <div className="mb-4 p-2 bg-yellow-100 text-xs">
        <strong>Debug:</strong> isEditingTimer: {isEditingTimer.toString()}, 
        timerCompleted: {timerCompleted.toString()}, 
        timeLeft: {timeLeft}
        <br />
        <strong>Temp values:</strong> hours: {tempHours}, minutes: {tempMinutes}, seconds: {tempSeconds}
        <button 
          onClick={() => {
            console.log('Test button clicked');
            setIsEditingTimer(true);
          }}
          className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
        >
          Test Edit Timer
        </button>
      </div>
      
      <div className="flex flex-col items-center space-y-4">
        {/* Topic Section */}
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Currently Discussing:</h2>
          {isEditingTopic ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={tempTopic}
                onChange={(e) => setTempTopic(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={handleTopicSave}
                className="text-green-600 hover:text-green-800 text-xl"
              >
                ✓
              </button>
              <button
                onClick={handleTopicCancel}
                className="text-red-600 hover:text-red-800 text-xl"
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingTopic(true)}
              className="text-xl font-bold text-blue-600 hover:text-blue-800 cursor-pointer hover:bg-blue-50 px-2 py-1 rounded transition-colors"
            >
              {topic}
            </div>
          )}
        </div>

        {/* Timer Section */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Timer:</h3>
          {isEditingTimer ? (
            <div className="flex flex-col items-center space-y-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-700 mb-2">Edit Timer Duration</div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={tempHours}
                    onChange={(e) => setTempHours(parseInt(e.target.value) || 0)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-500">h</span>
                </div>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={tempMinutes}
                    onChange={(e) => setTempMinutes(parseInt(e.target.value) || 0)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-500">m</span>
                </div>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={tempSeconds}
                    onChange={(e) => setTempSeconds(parseInt(e.target.value) || 0)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-500">s</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleTimerSave}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md font-medium transition-colors"
                >
                  Save ✓
                </button>
                <button
                  onClick={handleTimerCancel}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium transition-colors"
                >
                  Cancel ✕
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => {
                console.log('Timer clicked, setting isEditingTimer to true');
                console.log('Current state:', { timerCompleted, timeLeft, isRunning });
                setIsEditingTimer(true);
              }}
              className={`text-3xl font-mono px-4 py-2 rounded transition-colors flex items-center gap-2 ${
                timerCompleted 
                  ? 'text-red-600 bg-red-50 cursor-pointer hover:bg-red-100' 
                  : 'text-gray-800 hover:text-blue-600 cursor-pointer hover:bg-blue-50'
              }`}
              title="Click to edit timer"
            >
              {formatTime(timeLeft)}
              <span className="text-sm text-gray-400 hover:text-blue-400">✏️</span>
            </div>
          )}
        </div>

        {/* Timer Completed Message */}
        {timerCompleted && (
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600 mb-2">
              ⏰ Time's up!
            </div>
            {hasNextItem && (
              <div className="text-sm text-gray-600 mb-3">
                Next: <span className="font-medium">{nextItemText}</span>
              </div>
            )}
          </div>
        )}

        {/* Timer Controls */}
        <div className="flex flex-col items-center space-y-3">
          {/* Quick timer presets */}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setTimeLeft(300)} // 5 minutes
              disabled={isRunning}
              className="px-3 py-1 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 text-blue-700 rounded text-sm transition-colors"
            >
              5m
            </button>
            <button
              onClick={() => setTimeLeft(600)} // 10 minutes
              disabled={isRunning}
              className="px-3 py-1 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 text-blue-700 rounded text-sm transition-colors"
            >
              10m
            </button>
            <button
              onClick={() => setTimeLeft(900)} // 15 minutes
              disabled={isRunning}
              className="px-3 py-1 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 text-blue-700 rounded text-sm transition-colors"
            >
              15m
            </button>
            <button
              onClick={() => setTimeLeft(1800)} // 30 minutes
              disabled={isRunning}
              className="px-3 py-1 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 text-blue-700 rounded text-sm transition-colors"
            >
              30m
            </button>
          </div>
          
          {/* Main timer controls */}
          <div className="flex space-x-4">
            <button
              onClick={handleStartPause}
              disabled={timeLeft === 0}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                isRunning
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              } ${timeLeft === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Next Item Button - Only show when timer is completed */}
        {timerCompleted && hasNextItem && (
          <button
            onClick={handleNextItem}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors shadow-lg"
          >
            Next Item →
          </button>
        )}

        {/* No more items message */}
        {timerCompleted && !hasNextItem && (
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-600">
              🎉 All agenda items completed!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CurrentAgendaItem; 