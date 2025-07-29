import React from 'react';
import { useAgendaStore } from '../stores/useAgendaStore';

interface BtnAddAllTimersProps {
    className?: string;
}

export default function BtnAddAllTimers({ className = '' }: BtnAddAllTimersProps) {
    const { showAllTimers, toggleAllTimers, hasUnsavedChanges } = useAgendaStore();

    const handleClick = () => {
        // If there are unsaved changes, show a confirmation dialog
        if (hasUnsavedChanges()) {
            const confirmed = window.confirm(
                'You have unsaved changes. Are you sure you want to continue? This action is irreversible.'
            );
            if (!confirmed) return;
        }
        
        toggleAllTimers();
    };

    return (
        <button
            onClick={handleClick}
            className={`flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg transition-colors duration-200 ${className}`}
            title={showAllTimers ? 'Remove all timers' : 'Add all timers'}
        >
            {showAllTimers ? '−' : '+'}
        </button>
    );
} 