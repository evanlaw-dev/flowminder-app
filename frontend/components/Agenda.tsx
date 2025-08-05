"use client";
import React, { useEffect, useRef } from "react";
import AgendaItem from "./AgendaItem";
import BtnAddAgendaItem from "./BtnAddAgendaItem";
// import BtnAddAllTimers from "./BtnAddAllTimers";
// import BtnRemoveAllTimers from "./BtnRemoveAllTimers";
import { useAgendaStore } from '@/stores/useAgendaStore';
import { fetchAgendaItemsOnMount } from '@/services/agendaService'
import DropdownMenu from "./DropdownMenu";
import { meetingId } from "../services/agendaService"

export default function Agenda({ role = "participant" }: { role?: "host" | "participant" }) {
  const {
    loadItems,
    addItem,
    changeItem,
    removeItem,
    changeItemTimer,
    showAllTimers,
    isEditingMode,
    toggleEditingMode,
    getCurrentItem,
    getVisibleItems,
    lastAddedItemId,
    clearLastAddedItemId
  } = useAgendaStore();

  const setEditingMode = useAgendaStore((state) => state.setEditingMode); 
  const currentItem = getCurrentItem();
  const visibleItems = getVisibleItems();
  const newItemRef = useRef<HTMLLIElement>(null);

  // Fetch agenda items on mount
  useEffect(() => {
    fetchAgendaItemsOnMount(meetingId)
      .then(loadItems)          // <— loadItems now gets exactly the shape it wants
      .catch((err) => {
        console.error(err);
        alert("Could not load agenda items");
      });
  }, [loadItems]);

  useEffect(() => {
    if (lastAddedItemId && newItemRef.current) {
      newItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      clearLastAddedItemId();
    }
  }, [lastAddedItemId]);

  return (
    <div className="overflow-hidden px-3 pb-3 h-full">
      <div className="flex flex-col relative overflow-y-auto max-h-[var(--panel-list-height-max)] min-h-0">
        <div className="rounded-lg">
          {/* Header with dropdown menu for hosts */}
          <div className={`sticky shadow-b-md top-0 pt-5 z-20 bg-white flex justify-between items-center`}>
            <h2 className="font-semibold ml-3 text-lg">next on the agenda…</h2>
            {role === 'host' && (
              <DropdownMenu onEditClick={toggleEditingMode} />
            )}
          </div>

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
                isEditedTimer: false
              }}
              onChange={changeItem}
              onChangeTimer={changeItemTimer}
              onRemove={removeItem}
              canEdit={isEditingMode}
              showTimers={showAllTimers}
            />
          ) : (
            <ul className="list-none mb-2">
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
          {role === 'host' && (
            <BtnAddAgendaItem
              onAdd={addItem}
              setEditingMode={() => setEditingMode(true)} 
            />
          )}
          {/* Timer Toggle Button and Save/Cancel Buttons
          {isEditingMode && (
            <>
              Add/Remove All Timers Button
              <div className="w-[10%] h-full absolute top-0 right-0 cursor-pointer flex items-center justify-center group">
                <div className="w-full h-full flex items-center justify-center 
                  group-hover:border group-hover:border-gray-300 group-hover:rounded-md group-hover:border-dashed">
                  {showAllTimers ? <BtnRemoveAllTimers /> : <BtnAddAllTimers />}
                </div>
              </div>
            </>
          )} */}
        </div>
      </div>
    </div>
  );
}
