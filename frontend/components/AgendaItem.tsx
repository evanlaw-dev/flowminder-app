import React, { useRef, useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { AgendaItemType } from '@/stores/useAgendaStore';

const ADD_ITEM_PLACEHOLDER = 'Add an agenda item';
const REMOVE_ITEM_PLACEHOLDER = 'Remove this agenda item';

interface AgendaItemProps {
  item: AgendaItemType;
  onChange: (id: string, newText: string) => void;
  onChangeTimer: (id: string, timerValue: number) => void;
  onRemove: (id: string) => void;
  renderAsDiv?: boolean;
  canEdit?: boolean;
  showTimers?: boolean;
  isCurrentItem?: boolean;
}

function AgendaItem({
  item,
  onChange,
  onChangeTimer,
  onRemove,
  renderAsDiv = false,
  canEdit = false,
  showTimers = false,
  isCurrentItem = false,
}: AgendaItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(item.text.trim() === '');
  const [timerInputValue, setTimerInputValue] = useState('');
  const divRef = useRef<HTMLDivElement | null>(null);

  const Wrapper: React.ElementType = renderAsDiv ? 'div' : 'li';

  useEffect(() => {
    if (divRef.current) {
      divRef.current.innerText = item.text;
      setIsEmpty(item.text.trim() === '');
    }
  }, [item.text]);

  // Update timer input value when item timer changes
  useEffect(() => {
    if (item.newTimerValue === 0) {
      setTimerInputValue('');
    } else {
      setTimerInputValue(formatTimer(item.newTimerValue));
    }
  }, [item.newTimerValue]);

  const handleClick = () => {
    if (!canEdit) return;  // Prevent editing when canEdit is false
    setIsEditing(true);
    setIsEmpty(false);
    setTimeout(() => {
      divRef.current?.focus();
    }, 0);
  };

  const handleBlur = () => {
    if (!canEdit) return; // Do nothing if editing is disabled
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

  const handleTimerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setTimerInputValue(inputValue);
  };

  const handleTimerBlur = () => {
    // Parse natural language input when user finishes typing
    const parsedValue = parseTimerInput(timerInputValue);
    onChangeTimer(item.id, parsedValue);
    
    // Update the input value to show formatted version
    if (parsedValue === 0) {
      setTimerInputValue('');
    } else {
      setTimerInputValue(formatTimer(parsedValue));
    }
  };

  const parseTimerInput = (input: string): number => {
    // Handle empty input
    if (!input.trim()) return 0;
    
    // Handle pure numbers (seconds)
    if (/^\d+$/.test(input)) {
      return parseInt(input, 10);
    }
    
    // Handle MM:SS format
    const timeMatch = input.match(/^(\d+):(\d{1,2})$/);
    if (timeMatch) {
      const minutes = parseInt(timeMatch[1], 10);
      const seconds = parseInt(timeMatch[2], 10);
      return minutes * 60 + seconds;
    }
    
    // Handle natural language (5m, 1h, etc.)
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
    
    // Handle combined format (2m30s)
    const combinedMatch = input.match(/^(\d+)m(\d+)s$/i);
    if (combinedMatch) {
      const minutes = parseInt(combinedMatch[1], 10);
      const seconds = parseInt(combinedMatch[2], 10);
      return minutes * 60 + seconds;
    }
    
    // Try to parse as a number (fallback)
    const numValue = parseInt(input, 10);
    return isNaN(numValue) ? 0 : numValue;
  };

  const handleTimerIncrement = (increment: number) => {
    const currentValue = item.newTimerValue;
    const newValue = Math.max(0, currentValue + (increment * 60)); // Increment by minutes
    onChangeTimer(item.id, newValue);
  };

  const formatTimer = (seconds: number) => {
    if (seconds === 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Wrapper
      className="relative mr-3 last:border-0 border-b border-gray-200 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex items-center gap-2 ${showTimers ? 'w-full' : ''}`}>
        {/* Agenda Text - 70% width when timers are shown */}
        <div className={`relative ${showTimers ? 'w-[70%]' : 'w-full'}`}>
          {isEmpty && !isEditing && (
            <span className="absolute left-3 top-2 text-gray-400 italic pointer-events-none select-none">
              {ADD_ITEM_PLACEHOLDER}
            </span>
          )}

          <div
            ref={divRef}
            contentEditable={canEdit}
            suppressContentEditableWarning
            onClick={handleClick}
            onBlurCapture={handleBlur}
            onInput={handleInput}
            onBlur={handleTimerBlur}
            title={!canEdit && item.text.length > 80 ? item.text : undefined}
            className={`p-2 w-full min-h-[2rem] whitespace-pre-wrap break-words overflow-y-auto rounded-lg focus:outline-none 
              ${isEditing ? 'pr-10 border-blue-100' : 'border-gray-300 hover:border-gray-400'}
              ${isEmpty ? 'text-gray-400 italic' : 'text-black'}
              ${canEdit ? 'focus:ring-2' : 'cursor-default select-none'}
              ${!canEdit ? 'max-w-full overflow-hidden text-ellipsis' : ''}
            `}
            spellCheck={false}
            tabIndex={canEdit ? 0 : -1}
          />

          {/* Remove agenda item button ("X") */}
          {isHovered && canEdit && (
            <button
              className="absolute right-full top-1/2 -translate-y-1/2 text-red-600 hover:text-red-800 transition cursor-pointer"
              title={REMOVE_ITEM_PLACEHOLDER}
              aria-label={REMOVE_ITEM_PLACEHOLDER}
              onClick={() => onRemove(item.id)}
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* Timer Input Field - 30% width when timers are shown */}
        {showTimers && (
          <div className="w-[30%] flex items-center min-w-0">
            {canEdit ? (
              <div className="w-full flex items-center min-w-0">
                <input
                  type="text"
                  className="flex-1 p-2 border border-gray-300 rounded-l text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0 w-96"
                  value={timerInputValue}
                  onChange={handleTimerChange}
                  onBlur={handleTimerBlur}
                  placeholder="0:00"
                  title="Enter time as: 5m, 2:30, 1h, or 90s"
                />
                <div className="flex flex-col flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleTimerIncrement(1)}
                    className="px-3 py-2 border border-gray-300 border-l-0 text-sm hover:bg-gray-100"
                    title="Add 1 minute"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTimerIncrement(-1)}
                    className="px-3 py-2 border border-gray-300 border-l-0 border-t-0 text-sm hover:bg-gray-100"
                    title="Subtract 1 minute"
                  >
                    ▼
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full p-2 text-sm text-gray-600 bg-gray-50 rounded min-w-0 overflow-hidden text-ellipsis">
                {formatTimer(item.newTimerValue)}
              </div>
            )}
          </div>
        )}
      </div>
    </Wrapper>
  );
}

export default AgendaItem;
