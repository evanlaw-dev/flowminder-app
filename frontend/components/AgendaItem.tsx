import React, { useRef, useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const ADD_ITEM_PLACEHOLDER = 'Add an agenda item';
const REMOVE_ITEM_PLACEHOLDER = 'Remove this agenda item';

// This component represents a single agenda item in the agenda list.
// It allows users to edit the text, remove the item, and handles hover states for interaction
// It informs the parent component about the changes to the item text or when the item is removed.

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


// The AgendaItem component
function AgendaItem({ item, onChange, onRemove, renderAsDiv = false, canEdit = true }: AgendaItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const divRef = useRef<HTMLDivElement | null>(null);

  const Wrapper: React.ElementType = renderAsDiv ? 'div' : 'li';

  
  useEffect(() => {
    if (divRef.current) {
      divRef.current.innerText = item.text;
      setIsEmpty(item.text.trim() === '');
    }
  }, [item.text]);

  // If the item is not editable, just render it as a static list item
  // This is useful for participants who should not edit agenda items
  if (!canEdit) {
    return (
      <li className="text-black p-2">{item.text}</li>
    );
  }

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

  return (
    <Wrapper
      // className="flex items-center gap-3 mb-2 group"
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
    </Wrapper>
  );
}


export default AgendaItem;
