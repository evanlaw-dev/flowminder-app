import React from 'react'
import { useAgendaStore } from '@/stores/useAgendaStore';
import { saveItemsToBackend } from '@/services/agendaService';

function BtnCancelSave() {

    const { items, hasUnsavedChanges, resetItems, toggleEditingMode, saveSuccess } = useAgendaStore();
    const saveItems = async () => {
        try {
            await saveItemsToBackend(items, saveSuccess);
        } catch (err) {
            console.error(err);
            alert("Failed to save agenda — please try again.");
        }
    };

    const handleCancel = () => {
        if (hasUnsavedChanges()) {
            const confirmed = window.confirm(
                'You have unsaved changes. Are you sure you want to cancel? This action is irreversible.'
            );
            if (!confirmed) return;
        }
        resetItems();
        toggleEditingMode();
    };

    const handleSave = () => {
        saveItems();
        toggleEditingMode();
    };
    return (
        <div className="flex gap-2 mb-2">
            <button
                onClick={handleCancel}
                className="flex-1 rounded-full border border-black/10 hover:bg-stone-100/30 h-10 sm:h-12"
            >
                Cancel
            </button>
            <button
                onClick={handleSave}
                className="flex-1 rounded-full bg-red-800/85 text-white hover:bg-red-900/90 h-10 sm:h-12"
            >
                Save
            </button>
        </div>
    )
}

export default BtnCancelSave
