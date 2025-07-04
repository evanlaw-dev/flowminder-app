import React from 'react'
import { FaPlus } from 'react-icons/fa6'

// This component is used to display a padding button for the "Add Timers" button
// It shows a plus icon when hovered and a tooltip with "Add Timers" text
// The parent component is responsible for handling the click event to add timers

export default function BtnAddTimersPadding({ isHovered, onAddTimers }: { isHovered: boolean, onAddTimers: () => void }) {
    const handleClick = () => {
        console.log("Add Timers clicked");
        // notify the parent component to add timers
        // this is a callback function passed as a prop
        onAddTimers();
    }
    return (
        <div onClick={handleClick}>
            {isHovered && <FaPlus className="opacity-100 text-gray-500" />}

            {/* Tooltip on hover */}
            {isHovered && (
                <div className="absolute top-full right-0 mt-1 bg-red-900 text-white text-sm rounded px-2 py-1 whitespace-nowrap">
                    Add Timers
                </div>
            )}
        </div>
    )
}