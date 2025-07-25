"use client";
import React, { useState, useEffect } from "react";
import AgendaItem from "./AgendaItem";
import BtnAddAgendaItem from "./BtnAddAgendaItem";
import BtnAddTimersPadding from "./BtnAddTimersPadding";
import { useAgendaStore } from '@/stores/useAgendaStore';

export default function Agenda({ role = "participant" }: { role?: "host" | "participant" }) {
  const items = useAgendaStore((state) => state.items);
  // const currentItemIndex = useAgendaStore((state) => state.currentItemIndex);
  const loadItems = useAgendaStore((state) => state.loadItems);
  const addItem = useAgendaStore((state) => state.addItem);
  const changeItem = useAgendaStore((state) => state.changeItem);
  const removeItem = useAgendaStore((state) => state.removeItem);
  const resetItems = useAgendaStore((state) => state.resetItems);
  const saveSuccess = useAgendaStore((state) => state.saveSuccess);

  const visibleItems = items.filter((it) => !it.isDeleted && !it.isProcessed);
  const visibleItemsAgenda = visibleItems.splice(1);


  // Fetch agenda items on mount
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/agenda?meeting_id=a8f52a02-5aa8-45ec-9549-79ad2a194fa4`)
      .then((res) => res.json())
      .then((data) => {
        loadItems(data.items);
      });
  }, [loadItems]);

  const saveItems = async () => {
    const itemsToSave = items.filter(
      it => (it.isEdited || it.isNew || it.isDeleted) && it.text.trim() !== ""
    );

    for (const item of itemsToSave) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/agenda`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meeting_id: 'a8f52a02-5aa8-45ec-9549-79ad2a194fa4',
            agenda_item: item.text,
            duration_seconds: 200
          })
        });

        const result = await response.json();
        console.log('Saved agenda item:', result);

      } catch (error) {
        console.error('Error saving agenda item:', error);
      }
    }

    // After successful save, you can trigger saveSuccess
    saveSuccess(items);
  };

  // EFFECTS
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <div className="w-[80%] relative">
        <div className="bg-stone-400/95 p-8 rounded-lg space-y-4">
          <h2 className="font-semibold text-lg">next on the agenda…</h2>

          {/* render the host version for all items 
          except the first (current item is displayed in header) */}
          {visibleItemsAgenda.length === 0 && role === 'host' ? (
            <AgendaItem
              renderAsDiv={true}
              item={{ id: "placeholder", text: "", originalText: "", isNew: false, isEdited: false, isDeleted: false, isProcessed: false }}
              onChange={changeItem}
              onRemove={removeItem}
              canEdit={true}
            />
          ) : (
            <ul className="space-y-2 list-none mb-2">
              {visibleItemsAgenda.map((item) => ( 
                <AgendaItem
                  key={item.id}
                  item={item}
                  onChange={changeItem}
                  onRemove={removeItem}
                  canEdit={role === 'host'}
                />
              ))}
            </ul>
          )}

          {role === "host" && <BtnAddAgendaItem onAdd={addItem} />}

          <div
            className={`w-[10%] h-full absolute top-0 right-0 cursor-pointer flex items-center justify-center
              ${isHovered ? 'border border-gray-300 rounded-md border-dashed' : 'bg-transparent'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <BtnAddTimersPadding isHovered={isHovered} onAddTimers={() => { }} />
          </div>

          {role === 'host' && items.filter((item) => (item.isEdited || item.isDeleted)).length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={resetItems}
                className="flex-1 rounded-full border border-black/10 hover:bg-stone-400 h-10 sm:h-12"
              >
                Cancel
              </button>
              <button
                onClick={saveItems}
                className="flex-1 rounded-full bg-red-800/85 text-white hover:bg-red-900/90 h-10 sm:h-12"
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
