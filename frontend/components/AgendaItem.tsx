import React, { useRef, useState, useEffect, type FC } from 'react';
import type * as ReactNamespace from 'react';
import io from 'socket.io-client';
import { FaTimes, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
// If you see type errors for these imports, run:
//   npm install --save-dev @types/react @types/react-dom @types/react-icons @types/socket.io-client

const ADD_ITEM_PLACEHOLDER = 'Add an agenda item';
const REMOVE_ITEM_PLACEHOLDER = 'Remove this agenda item';

// Types for the agenda item and its props
interface AgendaItemType {
  id: string;
  text: string;
  originalText: string;
  isNew: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  // Timer fields
  timer_value?: number;
  is_running?: boolean;
  last_updated?: string;
  initial_value?: number;
  duration_seconds?: number;
}

interface AgendaItemProps {
  item: AgendaItemType;
  onChange: (id: string, newText: string) => void;
  onRemove: (id: string) => void;
  onAdd?: () => void; // Add this prop
  renderAsDiv?: boolean;
  canEdit?: boolean;
}

// For demo: hardcode meetingId and isHost
const meetingId = 'demo-meeting'; // Replace with real meetingId prop
const isHost = true; // Replace with real isHost prop
const socket = io('http://localhost:3000'); // Use your backend URL

// Timer state type
interface TimerState {
  remaining: number;
  [key: string]: any;
}

// The AgendaItem component
const AgendaItem: FC<AgendaItemProps> = (props: AgendaItemProps) => {
  const { item, onChange, onRemove, renderAsDiv = false, canEdit = true } = props;
  console.log('AgendaItem received item:', item);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isEmpty, setIsEmpty] = useState<boolean>(true);
  const divRef = useRef<HTMLDivElement | null>(null);
  // Remove socket and local timer state logic for now
  const [timerInput, setTimerInput] = useState<string>('');
  const router = useRouter();

  // Real-time timer state
  const [localTimerValue, setLocalTimerValue] = useState<number>(item.timer_value || item.duration_seconds || 0);
  const [localIsRunning, setLocalIsRunning] = useState<boolean>(item.is_running || false);
  
  // Sound and notification settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [hasShownWarning, setHasShownWarning] = useState<boolean>(false);

  // Audio context for sound alerts
  const audioContextRef = useRef<AudioContext | null>(null);

  // Timer display logic
  const formatTime = (secs?: number) => {
    if (typeof secs !== 'number' || isNaN(secs)) return '--:--';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Real-time countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (localIsRunning && localTimerValue > 0) {
      interval = setInterval(() => {
        setLocalTimerValue(prev => {
          const newValue = Math.max(0, prev - 1);
          
          // Auto-pause when timer reaches 0
          if (newValue === 0) {
            setLocalIsRunning(false);
            setHasShownWarning(false);
          }
          
          return newValue;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [localIsRunning]); // Only depend on localIsRunning

  // Separate effect for sound and notifications to avoid re-renders
  useEffect(() => {
    if (localTimerValue === 30 && !hasShownWarning && localIsRunning) {
      setHasShownWarning(true);
      
      // Play warning sound
      if (soundEnabled) {
        try {
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }
          
          const audioContext = audioContextRef.current;
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
          console.log('Audio not supported or blocked:', error);
        }
      }
      
      // Show notification
      if (notificationsEnabled && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Timer Warning', {
            body: 'Timer has 30 seconds remaining!',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: `timer-${item.id}`,
            requireInteraction: true
          });
        } else if (Notification.permission === 'default') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('Timer Warning', {
                body: 'Timer has 30 seconds remaining!',
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: `timer-${item.id}`,
                requireInteraction: true
              });
            }
          });
        }
      }
    }
  }, [localTimerValue, hasShownWarning, localIsRunning, soundEnabled, notificationsEnabled, item.id]);

  // Separate effect for timer completion
  useEffect(() => {
    if (localTimerValue === 0 && !localIsRunning) {
      // Play completion sound
      if (soundEnabled) {
        try {
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }
          
          const audioContext = audioContextRef.current;
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
          console.log('Audio not supported or blocked:', error);
        }
      }
      
      // Show completion notification
      if (notificationsEnabled && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Timer Complete!', {
            body: 'Timer has finished.',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: `timer-${item.id}`,
            requireInteraction: true
          });
        } else if (Notification.permission === 'default') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('Timer Complete!', {
                body: 'Timer has finished.',
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: `timer-${item.id}`,
                requireInteraction: true
              });
            }
          });
        }
      }
    }
  }, [localTimerValue, localIsRunning, soundEnabled, notificationsEnabled, item.id]);

  // Sync with item props when they change
  useEffect(() => {
    setLocalTimerValue(item.timer_value || item.duration_seconds || 0);
    setLocalIsRunning(item.is_running || false);
  }, [item.timer_value, item.duration_seconds, item.is_running]);

  useEffect(() => {
    socket.emit('joinMeeting', meetingId);
    const handleUpdate = ({ agendaItemId, timerState }: { agendaItemId: string; timerState: TimerState }) => {
      if (agendaItemId === item.id) {
        // This part is no longer needed as timer state is passed as a prop
        // setTimer(timerState);
      }
    };
    socket.on('timer:update', handleUpdate);
    return () => {
      socket.off('timer:update', handleUpdate);
    };
  }, [item.id]);

  const Wrapper: React.ElementType = renderAsDiv ? 'div' : 'li';

  useEffect(() => {
    if (divRef.current) {
      divRef.current.innerText = item.text || '';
      setIsEmpty((item.text || '').trim() === '');
    }
  }, [item.text]);

  if (!canEdit) {
    return (
      <li className="text-black p-2">{item.text || ''}</li>
    );
  }

  const handleClick = () => {
    setIsEditing(true);
    setIsEmpty(false);
    setTimeout(() => {
      divRef.current?.focus();
    }, 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    setTimeout(() => {
      if (!divRef.current) return;
      const text = divRef.current.innerText.trim();
      if (text === '') {
        divRef.current.innerText = '';
        setIsEmpty(true);
      } else {
        setIsEmpty(false);
        if (text !== (item.text || '')) {
          onChange(item.id, text);
        }
      }
    }, 30);
  };

  const handleInput = () => {
    if (divRef.current) {
      const newText = divRef.current.innerText.trim();
      setIsEmpty(newText === '');
    }
  };

  // Timer control handlers (call backend and refresh agenda)
  const startTimer = async () => {
    setLocalIsRunning(true);
    setHasShownWarning(false);
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/agenda/${item.id}/timer`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timer_value: localTimerValue,
        is_running: true,
        last_updated: new Date().toISOString(),
        initial_value: item.initial_value ?? item.duration_seconds ?? 0
      })
    });
    router.refresh();
  };
  
  const pauseTimer = async () => {
    setLocalIsRunning(false);
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/agenda/${item.id}/timer`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        timer_value: localTimerValue,
        is_running: false, 
        last_updated: new Date().toISOString() 
      })
    });
    router.refresh();
  };
  
  const resetTimer = async () => {
    const initialValue = item.initial_value ?? item.duration_seconds ?? 0;
    setLocalTimerValue(initialValue);
    setLocalIsRunning(false);
    setHasShownWarning(false);
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/agenda/${item.id}/timer/reset`, {
      method: 'POST'
    });
    router.refresh();
  };
  
  const editTimer = async () => {
    const newDuration = parseInt(timerInput);
    if (!isNaN(newDuration) && newDuration > 0) {
      setLocalTimerValue(newDuration);
      setLocalIsRunning(false);
      setHasShownWarning(false);
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/agenda/${item.id}/timer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timer_value: newDuration,
          initial_value: newDuration,
          last_updated: new Date().toISOString()
        })
      });
      setTimerInput('');
      router.refresh();
    }
  };

  // Quick timer presets
  const setQuickTimer = async (seconds: number) => {
    setLocalTimerValue(seconds);
    setLocalIsRunning(false);
    setHasShownWarning(false);
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/agenda/${item.id}/timer`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timer_value: seconds,
        initial_value: seconds,
        last_updated: new Date().toISOString()
      })
    });
    router.refresh();
  };

  return (
    <Wrapper
      className="relative mr-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="">
        {/* Placeholder text when empty and not editing */}
        {isEmpty && !isEditing && (
          <span className="absolute left-3 top-2 text-gray-400 italic pointer-events-none select-none">
            {ADD_ITEM_PLACEHOLDER}
          </span>
        )}
        {/* Editable text area */}
        <div
          ref={divRef}
          contentEditable
          suppressContentEditableWarning
          onClick={handleClick}
          onBlurCapture={handleBlur}
          onInput={handleInput}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (typeof props.onAdd === 'function') {
                props.onAdd();
              }
            }
          }}
          className={`min-w-[80%] p-2 pr-10 w-full min-h-[2rem] whitespace-pre-wrap break-words overflow-y-auto rounded-lg border focus:outline-none focus:ring-2 bg-white
            ${isEditing ? 'border-blue-100' : 'border-gray-300 hover:border-gray-400'}
            ${isEmpty ? 'text-gray-400 italic' : 'text-black'}`}
          spellCheck={false}
          tabIndex={0}
          data-placeholder={ADD_ITEM_PLACEHOLDER}
        />
        {/* Show remove button only when hovered or item is new/edited */}
        {(isHovered || item.isNew || item.isEdited) && (
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-600 ml-1 transition cursor-pointer"
            title={REMOVE_ITEM_PLACEHOLDER}
            aria-label={REMOVE_ITEM_PLACEHOLDER}
            onClick={() => onRemove(item.id)}
          >
            <FaTimes />
          </button>
        )}
        {/* Timer UI (centered display and controls) */}
        <div className="mt-2 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <span className={`font-mono text-lg font-bold ${localTimerValue <= 30 && localIsRunning ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
              {formatTime(localTimerValue)}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${localIsRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              {localIsRunning ? 'Running' : 'Paused'}
            </span>
            {/* Sound toggle button */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1 rounded ${soundEnabled ? 'text-blue-600' : 'text-gray-400'}`}
              title={soundEnabled ? 'Disable sound' : 'Enable sound'}
            >
              {soundEnabled ? <FaVolumeUp size={12} /> : <FaVolumeMute size={12} />}
            </button>
          </div>
          {isHost && (
            <div className="flex flex-col items-center gap-2">
              {/* Quick timer presets */}
              <div className="flex flex-row flex-wrap justify-center items-center gap-1">
                <button onClick={() => setQuickTimer(300)} className="px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs transition-colors">5m</button>
                <button onClick={() => setQuickTimer(600)} className="px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs transition-colors">10m</button>
                <button onClick={() => setQuickTimer(900)} className="px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs transition-colors">15m</button>
                <button onClick={() => setQuickTimer(1800)} className="px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs transition-colors">30m</button>
              </div>
              {/* Main timer controls */}
              <div className="flex flex-row flex-wrap justify-center items-center gap-2">
                <button 
                  onClick={startTimer} 
                  disabled={localIsRunning || localTimerValue === 0}
                  className="px-3 py-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded text-sm font-medium transition-colors"
                >
                  Start
                </button>
                <button 
                  onClick={pauseTimer} 
                  disabled={!localIsRunning}
                  className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white rounded text-sm font-medium transition-colors"
                >
                  Pause
                </button>
                <button 
                  onClick={resetTimer} 
                  className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm font-medium transition-colors"
                >
                  Reset
                </button>
              </div>
              {/* Custom timer input */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  placeholder="Custom seconds"
                  value={timerInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimerInput(e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  onClick={editTimer} 
                  disabled={!timerInput || parseInt(timerInput) <= 0}
                  className="px-3 py-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white rounded text-sm font-medium transition-colors"
                >
                  Set
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  );
};

export default AgendaItem;
