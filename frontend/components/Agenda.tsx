"use client";
import React, { useEffect } from "react";
import AgendaItem from "./AgendaItem";
import BtnAddAgendaItem from "./BtnAddAgendaItem";
import { useAgendaStore } from '@/stores/useAgendaStore';
import { fetchAgendaItemsOnMount } from '@/services/agendaService';
import DropdownMenu from "./DropdownMenu";
import { meetingId } from "../services/agendaService";
import '../app/globals.css';

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
  } = useAgendaStore();

  const setEditingMode = useAgendaStore((state) => state.setEditingMode);
  const currentItem = getCurrentItem();
  const visibleItems = getVisibleItems();

  // Fetch agenda items on mount
  useEffect(() => {
    fetchAgendaItemsOnMount(meetingId)
      .then(loadItems)
      .catch((err) => {
        console.error(err);
        alert("Could not load agenda items");
      });
  }, [loadItems]);

  return (
    <>
      {/* Header with dropdown menu for hosts */}
      <div className={`sticky top-0 z-30 bg-[var(--primary)] .shadow-bottom`}>
        <div className={`pt-2 ml-2 mr-4 pb-1 bg-[var(--primary)] flex justify-between items-center`}>
          <h2 className="font-semibold text-lg truncate">next on the agenda…</h2>
          {role === 'host' && (
            <DropdownMenu onEditClick={toggleEditingMode} onTimerClick={toggleEditingMode} />
          )}
        </div>
      </div>
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
            autoFocus={item.id === lastAddedItemId}
          />
        ))}
      </ul>

      {/* Add Agenda Item Button */}
      {role === 'host' && (
        <BtnAddAgendaItem
          onAdd={addItem}
          setEditingMode={() => setEditingMode(true)}
        />
      )}
    </>
  );
}
