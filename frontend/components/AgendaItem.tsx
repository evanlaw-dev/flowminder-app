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
  onChange: (id: string, newText: string, newTimer?: number) => void;
  onRemove: (id: string) => void;
  onAdd?: () => void;
  renderAsDiv?: boolean;
  canEdit?: boolean;
  editingId?: string | null;
  setEditingId?: (id: string | null) => void;
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

  // Simple timer effect with no dependencies to avoid re-renders
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (localIsRunning && localTimerValue > 0) {
      interval = setInterval(() => {
        setLocalTimerValue(prev => {
          const newValue = Math.max(0, prev - 1);
          
          // Handle timer completion
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
  }, [localIsRunning]);

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
    const initialValue = item.duration_seconds || item.initial_value || 300; // Use duration_seconds first, then fallback
    setLocalTimerValue(initialValue);
    setLocalIsRunning(false);
    setHasShownWarning(false);
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/agenda/${item.id}/timer/reset`, {
      method: 'POST'
    });
    router.refresh();
  };
  
  const editTimer = async () => {
    const newDuration = parseInt(editTimer.toString()); // Use editTimer directly
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
          duration_seconds: newDuration, // Update the duration_seconds field
          last_updated: new Date().toISOString()
        })
      });
      setEditTimer(newDuration); // Update editTimer state
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
        duration_seconds: seconds, // Update the duration_seconds field
        last_updated: new Date().toISOString()
      })
    });
    setEditTimer(seconds); // Update editTimer state
    router.refresh();
  };

  const [editText, setEditText] = useState(item.text);
  const [editTimer, setEditTimer] = useState<number>(item.timer_value || item.duration_seconds || 0);

  useEffect(() => {
    setEditText(item.text);
    setEditTimer(item.timer_value || item.duration_seconds || 0);
  }, [item.text, item.timer_value, item.duration_seconds]);

  const isEditMode = props.editingId === item.id;

  const handleSave = () => {
    if (editText.trim() !== "" && editTimer > 0) {
      onChange(item.id, editText, editTimer);
      if (props.setEditingId) props.setEditingId(null);
    }
  };
  const handleCancel = () => {
    setEditText(item.text);
    setEditTimer(item.timer_value || item.duration_seconds || 0);
    if (props.setEditingId) props.setEditingId(null);
  };

  return (
    <Wrapper className="relative flex items-center gap-2 p-2 border-b border-gray-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isEditMode ? (
        <>
          <input
            type="text"
            value={editText}
            onChange={e => setEditText(e.target.value)}
            className="flex-1 px-2 py-1 border rounded mr-2"
          />
          <input
            type="number"
            min={1}
            value={editTimer}
            onChange={e => setEditTimer(Number(e.target.value))}
            className="w-24 px-2 py-1 border rounded mr-2"
          />
          <button onClick={handleSave} className="px-3 py-1 bg-green-500 text-white rounded mr-1">Save</button>
          <button onClick={handleCancel} className="px-3 py-1 bg-gray-400 text-white rounded">Cancel</button>
        </>
      ) : (
        <>
          <span className="flex-1 truncate">{item.text}</span>
          <span className="font-mono w-16 text-center">{formatTime(item.timer_value || item.duration_seconds || 0)}</span>
          <button onClick={() => props.setEditingId && props.setEditingId(item.id)} className="px-2 py-1 bg-blue-500 text-white rounded">Change</button>
          {(isHovered || item.isNew || item.isEdited) && (
            <button
              className="ml-2 text-red-400 hover:text-red-600 transition cursor-pointer"
              title={REMOVE_ITEM_PLACEHOLDER}
              aria-label={REMOVE_ITEM_PLACEHOLDER}
              onClick={() => onRemove(item.id)}
            >
              <FaTimes />
            </button>
          )}
        </>
      )}
    </Wrapper>
  );
};

export default AgendaItem;