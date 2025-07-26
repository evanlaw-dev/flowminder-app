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
}

function AgendaItem({
  item,
  onChange,
  onChangeTimer,
  onRemove,
  renderAsDiv = false,
  canEdit = true,
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

  const handleTimerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTimerValue = parseInt(e.target.value, 10) || 0;
    onChangeTimer(item.id, newTimerValue);
  };

  return (
    <Wrapper
      className="relative mr-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
    <div className={`flex items-center gap-2 ${showTimers ? 'w-full' : ''}`}>
      <div
        className={`relative ${showTimers ? 'w-[80%]' : 'w-full'}`}
      >
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
          onBlurCapture={handleBlur}
          onInput={handleInput}
          className={`p-2 pr-10 w-full min-h-[2rem] whitespace-pre-wrap break-words overflow-y-auto rounded-lg border focus:outline-none focus:ring-2 bg-white
            ${isEditing ? 'border-blue-100' : 'border-gray-300 hover:border-gray-400'}
            ${isEmpty ? 'text-gray-400 italic' : 'text-black'}`}
          spellCheck={false}
          tabIndex={0}
        />
        
        {/* remove agenda item button */}
        {isHovered && (
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-600 ml-1 transition cursor-pointer"
            title={REMOVE_ITEM_PLACEHOLDER}
            aria-label={REMOVE_ITEM_PLACEHOLDER}
            onClick={() => onRemove(item.id)}
          >
            <FaTimes />
          </button>
        )}
      </div>

      {/* Timer Input Field */}
      {canEdit && showTimers && (
        <input
          type="number"
          className="w-[20%] mt-2 w-20 p-1 border rounded text-sm "
          value={item.timerValue}
          onChange={handleTimerChange}
          placeholder="Timer (s)"
        />
      )}
      </div>
    </Wrapper>
  );
}

export default AgendaItem;
