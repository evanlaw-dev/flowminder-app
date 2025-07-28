"use client";
import React, { useState, useEffect } from "react";
import AgendaItem from "./AgendaItem";
import BtnAddAgendaItem from "./BtnAddAgendaItem";
import BtnAddAllTimers from "./BtnAddAllTimers";
import BtnRemoveAllTimers from "./BtnRemoveAllTimers";
import { useAgendaStore } from '@/stores/useAgendaStore';
import DropdownMenu from "./DropdownMenu";

export default function Agenda({ role = "participant" }: { role?: "host" | "participant" }) {
  const {
    items,
    loadItems,
    addItem,
    changeItem,
    removeItem,
    resetItems,
    changeItemTimer,
    showAllTimers,
    isEditingMode,
    toggleEditingMode,
    getCurrentItem,
    getVisibleItems,
    hasUnsavedChanges
  } = useAgendaStore();

  const currentItem = getCurrentItem();
  const visibleItems = getVisibleItems();

  // Fetch agenda items on mount
  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    fetch(`${backendUrl}/agenda?meeting_id=a8f52a02-5aa8-45ec-9549-79ad2a194fa4`)
      .then((res) => res.json())
      .then((data) => {
        loadItems(data.items);
      });
  }, [loadItems]);

  const saveItems = async () => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    
    // First, clear all existing items
    try {
      await fetch(`${backendUrl}/agenda?meeting_id=a8f52a02-5aa8-45ec-9549-79ad2a194fa4`, {
        method: 'DELETE'
      });
      console.log('Cleared existing items');
    } catch (error) {
      console.error('Error clearing items:', error);
    }

    // Then save only the non-deleted items
    const itemsToSave = items.filter(
      it => !it.isDeleted && it.text.trim() !== ""
    );

    console.log('Items to save:', itemsToSave);

    for (const item of itemsToSave) {
      try {
        const response = await fetch(`${backendUrl}/agenda`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meeting_id: 'a8f52a02-5aa8-45ec-9549-79ad2a194fa4',
            agenda_item: item.text,
            duration_seconds: item.newTimerValue || 0
          })
        });

        const result = await response.json();
        console.log('Saved agenda item:', result);

      } catch (error) {
        console.error('Error saving agenda item:', error);
      }
    }

    // Reload items from backend after saving
    try {
      const response = await fetch(`${backendUrl}/agenda?meeting_id=a8f52a02-5aa8-45ec-9549-79ad2a194fa4`);
      const data = await response.json();
      loadItems(data.items);
    } catch (error) {
      console.error('Error reloading items:', error);
    }
  };

  const handleEditClick = () => {
    console.log("isEditingMode on");
    toggleEditingMode();
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
    <>
      <div className="w-[80%] relative">
        <div className="bg-stone-400/95 p-10 rounded-lg space-y-4">
          {/* Header with dropdown menu for hosts */}
          {role === 'host' && (
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-lg">next on the agenda…</h2>
              <DropdownMenu onEditClick={handleEditClick} />
            </div>
          )}

          {/* Agenda Items */}
          {visibleItems.length === 0 ? (
            <AgendaItem
              renderAsDiv={true}
              item={{ 
                id: "placeholder", 
                text: "", 
                originalText: "", 
                isNew: false, 
                isEdited: false, 
                isDeleted: false, 
                isProcessed: false, 
                timerValue: 0, 
                originalTimerValue: 0,
                newTimerValue: 0,
                isEditedTimer: false 
              }}
              onChange={changeItem}
              onChangeTimer={changeItemTimer}
              onRemove={removeItem}
              canEdit={isEditingMode}
              showTimers={showAllTimers}
            />
          ) : (
            <ul className="space-y-2 list-none mb-2">
              {visibleItems.map((item) => (
                <AgendaItem
                  key={item.id}
                  item={item}
                  onChange={changeItem}
                  onChangeTimer={changeItemTimer}
                  onRemove={removeItem}
                  canEdit={isEditingMode || currentItem?.id === item.id}
                  showTimers={showAllTimers}
                  isCurrentItem={currentItem?.id === item.id}
                />
              ))}
            </ul>
          )}

          {/* Add Agenda Item Button */}
          {isEditingMode && <BtnAddAgendaItem onAdd={addItem} />}

          {/* Timer Toggle Button and Save/Cancel Buttons */}
          {isEditingMode && (
            <>
              {/* Add/Remove All Timers Button */}
              <div className="w-[10%] h-full absolute top-0 right-0 cursor-pointer flex items-center justify-center group">
                <div className="w-full h-full flex items-center justify-center 
                  group-hover:border group-hover:border-gray-300 group-hover:rounded-md group-hover:border-dashed">
                  {showAllTimers ? <BtnRemoveAllTimers /> : <BtnAddAllTimers />}
                </div>
              </div>

              {/* Save/Cancel Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 rounded-full border border-black/10 hover:bg-stone-400 h-10 sm:h-12"
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
            </>
          )}
        </div>
      </div>
    </>
  );
}
