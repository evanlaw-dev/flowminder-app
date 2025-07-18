import React, { useRef, useState, useEffect, type FC } from 'react';
import type * as ReactNamespace from 'react';
import io from 'socket.io-client';
import { FaTimes } from 'react-icons/fa';
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

  // Timer display logic
  const formatTime = (secs?: number) => {
    if (typeof secs !== 'number' || isNaN(secs)) return '--:--';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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
      divRef.current.innerText = item.text;
      setIsEmpty(item.text.trim() === '');
    }
  }, [item.text]);

  if (!canEdit) {
    return (
      <li className="text-black p-2">{item.text}</li>
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
        if (text !== item.text) {
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
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/agenda/${item.id}/timer`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timer_value: item.timer_value ?? item.duration_seconds ?? 0,
        is_running: true,
        last_updated: new Date().toISOString(),
        initial_value: item.initial_value ?? item.duration_seconds ?? 0
      })
    });
    router.refresh();
  };
  const pauseTimer = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/agenda/${item.id}/timer`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_running: false, last_updated: new Date().toISOString() })
    });
    router.refresh();
  };
  const resetTimer = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/agenda/${item.id}/timer/reset`, {
      method: 'POST'
    });
    router.refresh();
  };
  const editTimer = async () => {
    const newDuration = parseInt(timerInput);
    if (!isNaN(newDuration)) {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/agenda/${item.id}/timer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timer_value: newDuration,
          initial_value: newDuration,
          last_updated: new Date().toISOString()
        })
      });
      router.refresh();
    }
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
            <span className="font-mono text-sm">
              Timer: {formatTime(item.timer_value)}
            </span>
            <span className="text-xs text-gray-600">
              {item.is_running ? 'Running' : 'Paused'}
            </span>
          </div>
          {isHost && (
            <div className="flex flex-row flex-wrap justify-center items-center gap-2">
              <button onClick={startTimer} className="px-2 py-1 bg-green-200 rounded">Start</button>
              <button onClick={pauseTimer} className="px-2 py-1 bg-yellow-200 rounded">Pause</button>
              <button onClick={resetTimer} className="px-2 py-1 bg-gray-200 rounded">Reset</button>
              <input
                type="number"
                min="1"
                placeholder="sec"
                value={timerInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimerInput(e.target.value)}
                className="w-16 px-1 border rounded"
              />
              <button onClick={editTimer} className="px-2 py-1 bg-blue-200 rounded">Set</button>
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  );
};

export default AgendaItem;
