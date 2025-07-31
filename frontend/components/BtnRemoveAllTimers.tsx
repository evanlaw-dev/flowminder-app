import React from 'react';
import { useAgendaStore } from '../stores/useAgendaStore';

interface BtnRemoveAllTimersProps {
    className?: string;
}

// test comment so i can make a commit - Evan

export default function BtnRemoveAllTimers({ className = '' }: BtnRemoveAllTimersProps) {
    const { toggleAllTimers, hasUnsavedChanges } = useAgendaStore();

    const handleClick = () => {
        // If there are unsaved changes, show a confirmation dialog
        if (hasUnsavedChanges()) {
            const confirmed = window.confirm(
                'You have unsaved changes. Are you sure you want to hide timers? This action is irreversible.'
            );
            if (!confirmed) return;
        }
        
        toggleAllTimers();
    };

    return (
        <button
            onClick={handleClick}
            className={`w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors duration-200 ${className}`}
            title="Remove all timers"
        >
            <span className="text-lg font-bold">−</span>
        </button>
    );
} 