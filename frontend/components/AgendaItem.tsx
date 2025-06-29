import React, { useRef, useState, useEffect } from 'react';

const PLACEHOLDER = 'add a new agenda item';
const REMOVEITEM = 'remove this agenda item';

function AgendaItem() {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const divRef = useRef<HTMLDivElement | null>(null);

  // Check if the content is empty on mount and on blur
  useEffect(() => {
    if (divRef.current) {
      setIsEmpty(divRef.current.innerText.trim() === '');
    }
  }, []);

  const handleClick = () => {
    setIsEditing(true);
    setTimeout(() => {
      divRef.current?.focus();
    }, 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (divRef.current) {
      setIsEmpty(divRef.current.innerText.trim() === '');
    }
  };

  const handleInput = () => {
    if (divRef.current) {
      setIsEmpty(divRef.current.innerText.trim() === '');
    }
  };

  return (
    <li
      className="flex items-center gap-3 mb-2 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={divRef}
        data-placeholder={PLACEHOLDER}
        contentEditable
        suppressContentEditableWarning
        onClick={handleClick}
        onBlur={handleBlur}
        onInput={handleInput}
        className={`relative flex-1 p-2 rounded-lg border focus:outline-none focus:ring-2 min-h-[2.5rem] bg-white ${
          isEditing ? 'focus:ring-blue-300 border-blue-400' : 'border-gray-200'
        }`}
        spellCheck={false}
        tabIndex={0}
        style={{ minHeight: '2.5rem' }}
      >
        {isEmpty && !isEditing && (
          <span className="absolute left-3 top-2 text-gray-400 pointer-events-none select-none">
            {PLACEHOLDER}
          </span>
        )}
      </div>
      {isHovered && (
        <button
          className="text-red-400 hover:text-red-600 ml-4 transition"
          title={REMOVEITEM}
        >
          x
        </button>
      )}
    </li>
  );
}

export default AgendaItem;