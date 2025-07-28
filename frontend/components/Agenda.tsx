"use client";
import React, { useState, useEffect } from "react";
import AgendaItem from "./AgendaItem";
import BtnAddAgendaItem from "./BtnAddAgendaItem";
import BtnDisplayAllTimers from "./BtnDisplayAllTimers";
import { useAgendaStore } from '@/stores/useAgendaStore';
import DropdownMenu from "./DropdownMenu";

export default function Agenda({ role = "participant" }: { role?: "host" | "participant" }) {
  const items = useAgendaStore((state) => state.items);
  // const currentItemIndex = useAgendaStore((state) => state.currentItemIndex);
  const loadItems = useAgendaStore((state) => state.loadItems);
  const addItem = useAgendaStore((state) => state.addItem);
  const changeItem = useAgendaStore((state) => state.changeItem);
  const removeItem = useAgendaStore((state) => state.removeItem);
  const resetItems = useAgendaStore((state) => state.resetItems);
  // const saveSuccess = useAgendaStore((state) => state.saveSuccess);
  const changeItemTimer = useAgendaStore((state) => state.changeItemTimer);

  const visibleItems = items.filter((it) => !it.isDeleted && !it.isProcessed);
  const visibleItemsAgenda = visibleItems.slice(1);


  const [isEditingAll, setIsEditingAll] = useState(false);

  const handleEditClick = () => {
    console.log("isEditingMode on")
    setIsEditingAll(true);
  };


  const toggleEditMode = () => {
    console.log("isEditingMode")
    setIsEditingAll(!isEditingAll);
  };

  const [showTimers, setShowTimers] = useState(false);

  const handleShowTimers = () => {
    console.log("Show Timers triggered from Agenda Component.");
    setShowTimers((prev) => !prev);
  };


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
            duration_seconds: item.timerValue || 0
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

    // // After successful save, you can trigger saveSuccess
    // saveSuccess(items);
  };

  return (
    <>
      <div className="w-[80%] relative">
        <div className="bg-stone-400/95 p-10 rounded-lg space-y-4">


        {/* show dropdown menu if user is a host */}
          {role === 'host' && (
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-lg">next on the agenda…</h2>
              {role === 'host' && (
                <DropdownMenu onEditClick={handleEditClick} />
              )}
            </div>
          )}


          {/* if there are no agenda items to render, render a placeholder
          otherwise, 
              if editing mode is on, render all items (including header) and allow the items to be edited,
              otherwise, display only items from second onward, block editing */}
          {visibleItems.length === 0 ? (
            <AgendaItem
              renderAsDiv={true}
              item={{ id: "placeholder", text: "", originalText: "", isNew: false, isEdited: false, isDeleted: false, isProcessed: false, timerValue: 0, isEditedTimer: false, originalTimerValue: 0 }}
              onChange={changeItem}
              onChangeTimer={changeItemTimer}
              onRemove={removeItem}
              canEdit={true}
              showTimers={showTimers}
            />
          ) : (
            isEditingAll ? (
              visibleItems.map((item) => (
                <AgendaItem
                  key={item.id}
                  item={item}
                  onChange={changeItem}
                  onChangeTimer={changeItemTimer}
                  onRemove={removeItem}
                  canEdit={true}
                  showTimers={showTimers}
                />
              ))
            ) : (
              <ul className="space-y-2 list-none mb-2">
                {visibleItemsAgenda.map((item) => (
                  <AgendaItem
                    key={item.id}
                    item={item}
                    onChange={changeItem}
                    onChangeTimer={changeItemTimer}
                    onRemove={removeItem}
                    canEdit={false}
                    showTimers={showTimers}
                  />
                ))}
              </ul>
            )
          )}

          {isEditingAll && <BtnAddAgendaItem onAdd={addItem} />}


          {/* if fields are being edited, show CANCEL, SAVE buttons */}
          {isEditingAll && (

            <>
              {/* button add/remove all timers (right padding of the Agenda Component) */}
              <div
                className="w-[10%] h-full absolute top-0 right-0 cursor-pointer flex items-center justify-center group"
                onClick={handleShowTimers}
              >
                <div
                  className="w-full h-full flex items-center justify-center 
               group-hover:border group-hover:border-gray-300 group-hover:rounded-md group-hover:border-dashed"
                >
                  <BtnDisplayAllTimers showTimers={showTimers}/>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { resetItems(); toggleEditMode(); }}
                  className="flex-1 rounded-full border border-black/10 hover:bg-stone-400 h-10 sm:h-12"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { saveItems(); toggleEditMode(); }}
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
