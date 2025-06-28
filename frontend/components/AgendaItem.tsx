import React, { useRef, useState } from 'react';

const PLACEHOLDER = 'add a new agenda item';

function AgendaItem() {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const divRef = useRef<HTMLDivElement | null>(null);

  const handleClick = () => {
    setIsEditing(true);
    setTimeout(() => {
      divRef.current?.focus();
    }, 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  return (
    <li
      className="flex items-center gap-2 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={divRef}
        contentEditable
        suppressContentEditableWarning
        onClick={handleClick}
        onBlur={handleBlur}
        className={`relative flex-1 p-2 rounded-lg border focus:outline-none focus:ring-2 min-h-[2.5rem] bg-white ${
          isEditing ? 'focus:ring-blue-300 border-blue-400' : 'border-gray-200'
        }`}
        spellCheck={false}
        tabIndex={0}
        data-placeholder={PLACEHOLDER}
        style={{ minHeight: '2.5rem' }}
      >
        {/* Tailwind placeholder simulation */}
        {divRef.current && divRef.current.innerText === '' && !isEditing && (
          <span className="absolute left-3 top-2 text-gray-400 pointer-events-none select-none">
            {PLACEHOLDER}
          </span>
        )}
      </div>
      {isHovered && (
        <button
          className="text-grey-400 hover:text-grey-600 transition"
          title={PLACEHOLDER}
        >
          +
        </button>
      )}
    </li>
  );
};

export default AgendaItem;