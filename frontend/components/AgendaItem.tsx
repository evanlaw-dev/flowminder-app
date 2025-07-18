import React, { useRef, useState, useEffect, type FC } from 'react';
import type * as ReactNamespace from 'react';
import io from 'socket.io-client';
import { FaTimes } from 'react-icons/fa';
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
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isEmpty, setIsEmpty] = useState<boolean>(true);
  const divRef = useRef<HTMLDivElement | null>(null);
  const [timer, setTimer] = useState<TimerState | null>(null);
  const [timerInput, setTimerInput] = useState<string>('');

  useEffect(() => {
    socket.emit('joinMeeting', meetingId);
    const handleUpdate = ({ agendaItemId, timerState }: { agendaItemId: string; timerState: TimerState }) => {
      if (agendaItemId === item.id) setTimer(timerState);
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

  // Timer actions (host only)
  const startTimer = () => {
    const duration = timer ? timer.remaining : parseInt(timerInput) || 300;
    socket.emit('timer:start', { meetingId, agendaItemId: item.id, duration });
  };
  const pauseTimer = () => socket.emit('timer:pause', { meetingId, agendaItemId: item.id });
  const resetTimer = () => socket.emit('timer:reset', { meetingId, agendaItemId: item.id });
  const editTimer = () => {
    const newDuration = parseInt(timerInput);
    if (!isNaN(newDuration)) {
      socket.emit('timer:edit', { meetingId, agendaItemId: item.id, newDuration });
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor((secs || 0) / 60);
    const s = (secs || 0) % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
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
        {/* Timer UI */}
        <div className="mt-2 flex items-center gap-2">
          <span className="font-mono text-sm">
            Timer: {timer ? formatTime(timer.remaining) : '--:--'}
          </span>
          {isHost && (
            <>
              <button onClick={startTimer} className="ml-2 px-2 py-1 bg-green-200 rounded">Start</button>
              <button onClick={pauseTimer} className="ml-1 px-2 py-1 bg-yellow-200 rounded">Pause</button>
              <button onClick={resetTimer} className="ml-1 px-2 py-1 bg-gray-200 rounded">Reset</button>
              <input
                type="number"
                min="1"
                placeholder="sec"
                value={timerInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimerInput(e.target.value)}
                className="ml-2 w-16 px-1 border rounded"
              />
              <button onClick={editTimer} className="ml-1 px-2 py-1 bg-blue-200 rounded">Set</button>
            </>
          )}
        </div>
      </div>
    </Wrapper>
  );
};

export default AgendaItem;
