import React, { useRef, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const ADD_ITEM_PLACEHOLDER = 'Add an agenda item';
const REMOVE_ITEM_PLACEHOLDER = 'Remove this agenda item';

interface AgendaItemType {
  id: string;
  text: string;
  originalText: string;
  isNew: boolean;
  isEdited: boolean;
}

interface AgendaItemProps {
  item: AgendaItemType;
  onChange: (id: string, newText: string) => void;
  onRemove: (id: string) => void;
}

// For demo: hardcode meetingId and isHost
const meetingId = 'demo-meeting'; // Replace with real meetingId prop
const isHost = true; // Replace with real isHost prop
const socket = io('http://localhost:3000'); // Use your backend URL

function AgendaItem({ item, onChange, onRemove }: AgendaItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const divRef = useRef<HTMLDivElement | null>(null);
  const [timer, setTimer] = useState(null);
  const [timerInput, setTimerInput] = useState('');

  useEffect(() => {
    socket.emit('joinMeeting', meetingId);
    const handleUpdate = ({ agendaItemId, timerState }) => {
      if (agendaItemId === item.id) setTimer(timerState);
    };
    socket.on('timer:update', handleUpdate);
    return () => {
      socket.off('timer:update', handleUpdate);
    };
  }, [item.id]);

  useEffect(() => {
    if (divRef.current) {
      divRef.current.innerText = item.text;
      setIsEmpty(item.text.trim() === '');
    }
  }, [item.text]);


  // responsible for user interaction when they click on the text div
  const handleClick = () => {
    setIsEditing(true);
    setIsEmpty(false);
    setTimeout(() => {
      divRef.current?.focus();
    }, 0);
  };

  // responsible for saving changes when focus is lost (user clicks away or tabs out)
// fires when the editable <div> loses focus
const handleBlur = () => {
  setIsEditing(false);

  // 2️⃣ defer the empty‑check until the browser has finished
  //    moving the caret out of the contentEditable element
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

  // Format seconds as mm:ss
  const formatTime = (secs) => {
    const m = Math.floor((secs || 0) / 60);
    const s = (secs || 0) % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <li
      className="flex items-center gap-3 mb-2 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full">

        {isEmpty && !isEditing && (
          <span className="absolute left-3 top-2 text-gray-400 italic pointer-events-none select-none">
            {ADD_ITEM_PLACEHOLDER}
          </span>
        )}

        <div
          ref={divRef}
          contentEditable
          suppressContentEditableWarning
          onClick={handleClick}
          onBlur={handleBlur}
          onInput={handleInput}
          className={`p-2 rounded-lg border focus:outline-none focus:ring-2 min-h-[2.5rem] bg-white w-full 
            ${isEditing ? 'border-blue-100' : 'border-gray-300 hover:border-gray-400'} 
            ${isEmpty ? 'text-gray-400 italic' : 'text-black'}`}
          spellCheck={false}
          tabIndex={0}
        />
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
                onChange={e => setTimerInput(e.target.value)}
                className="ml-2 w-16 px-1 border rounded"
              />
              <button onClick={editTimer} className="ml-1 px-2 py-1 bg-blue-200 rounded">Set</button>
            </>
          )}
        </div>
      </div>

      {isHovered && (
        <button
          className="text-red-400 hover:text-red-600 ml-4 transition"
          title={REMOVE_ITEM_PLACEHOLDER}
          aria-label={REMOVE_ITEM_PLACEHOLDER}
          onClick={() => onRemove(item.id)}
        >
          x
        </button>
      )}
    </li>
  );
}

export default AgendaItem;
