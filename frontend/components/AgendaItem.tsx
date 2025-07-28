import React, { useRef, useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { AgendaItemType } from '@/stores/useAgendaStore';
import Timer from "./Timer"

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
}: AgendaItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(item.text.trim() === '');
  const divRef = useRef<HTMLDivElement | null>(null);

  const Wrapper: React.ElementType = renderAsDiv ? 'div' : 'li';

  useEffect(() => {
    if (divRef.current) {
      divRef.current.innerText = item.text;
      setIsEmpty(item.text.trim() === '');
    }
  }, [item.text]);

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
            // onBlur={handleTimerBlur}
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
            <Timer
              canEdit={canEdit}
              timerValue={item.newTimerValue}
              onChangeTimer={(val) => onChangeTimer(item.id, val)}
            />
          </div>
        )}
      </div>
    </Wrapper>
  );
}

export default AgendaItem;
