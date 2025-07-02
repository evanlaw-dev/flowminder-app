import React, { useState } from "react";

interface EmptyAgendaItemProps {
  onAdd: () => void;
}

const EmptyAgendaItem: React.FC<EmptyAgendaItemProps> = ({ onAdd }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <li
      className="relative flex items-center my-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ minHeight: "2.5rem" }}
    >
      {isHovered && (
        <button
          className="w-full flex items-center justify-between px-2 py-2 rounded-lg border border-dashed border-gray-300 bg-gray-100/60 transition-all duration-200 focus:outline-none"
          aria-label="Add an agenda item"
          onClick={onAdd}
          type="button"
        >
          {/* Simulated faded lines */}
          <div className="flex-1 flex flex-col gap-1 text-left">
            <div className="h-3 w-3/4 bg-gray-300 rounded opacity-60 mb-1"></div>
            <div className="h-3 w-1/2 bg-gray-300 rounded opacity-40"></div>
          </div>
          {/* Plus symbol */}
          <span className="ml-2 flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-300 shadow hover:bg-gray-200 transition text-2xl text-gray-400 font-bold leading-none">
            +
          </span>
        </button>
      )}
    </li>
  );
};

export default EmptyAgendaItem;