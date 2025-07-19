"use client";
import React, { useReducer, useState } from "react";
import { v4 as uuid } from "uuid";    // TODO on backend: Generates IDs
import AgendaItem from "./AgendaItem";
import BtnAddAgendaItem from "./BtnAddAgendaItem";
import { useEffect } from "react";
import BtnAddTimersPadding from "./BtnAddTimersPadding";


/* TYPES */
export interface AgendaItemType {
  id: string;
  text: string;
  originalText: string;
  isNew: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  // Timer fields from backend
  timer_value?: number;
  is_running?: boolean;
  last_updated?: string;
  initial_value?: number;
  duration_seconds?: number;
}

type AgendaAction =
  | { type: "LOAD"; items: AgendaItemType[] }
  | { type: "ADD" }
  | { type: "CHANGE"; id: string; text: string, isEdited?: boolean }
  | { type: "REMOVE"; id: string, isDeleted?: boolean }
  | { type: "RESET" }
  | { type: "SAVE_SUCCESS"; savedItems: AgendaItemType[] };


/* REDUCER */
function agendaReducer(state: AgendaItemType[], action: AgendaAction): AgendaItemType[] {
  switch (action.type) {
    case "LOAD":
      return action.items.map((it) => ({
        ...it,
        text: it.text || (it as any).agenda_item || "",
        originalText: it.text || (it as any).agenda_item || "",
        isNew: false,
        isEdited: false,
        isDeleted: false,
        timer_value: (it as any).timer_value,
        is_running: (it as any).is_running,
        last_updated: (it as any).last_updated,
        initial_value: (it as any).initial_value,
        duration_seconds: (it as any).duration_seconds,
      }));

    case "ADD":
      return [
        ...state,
        {
          id: uuid(),
          text: "",
          originalText: "",
          isNew: true,
          isEdited: false,
          isDeleted: false,
        },
      ];

    case "CHANGE":
      // If editing the placeholder, promote it to a real item
      if (action.id === "placeholder") {
        return [
          {
            id: uuid(),
            text: action.text,
            originalText: "",
            isNew: true,
            isEdited: true,
            isDeleted: false,
          },
          ...state
        ];
      }
      return state.map((it) =>
        it.id === action.id
          ? { ...it, text: action.text, isEdited: action.text !== it.originalText }
          : it
      );
    case "REMOVE":
      return state
        .map((it) =>
          it.id === action.id ? { ...it, isDeleted: true } : it
        )

    case "RESET":
      // Revert all items to their original state
      // If an item is edited, it will be brought back to its original text
      // If an existing item is deleted, it will be reverted to its original state
      // If a new item is deleted, it will be removed from the state
      return state
        .filter((it) => !it.isNew) // Keep only non-empty items
        .map((it) => ({ ...it, text: it.originalText, isEdited: false, isDeleted: false }));

    case "SAVE_SUCCESS":
      // This action is dispatched when the save operation is successful
      // It replaces the current state with the saved items from the server
      // This ensures that the state is always in sync with the server data  
      // The server is now the single source of truth
      return action.savedItems.map((it) => ({
        ...it,
        originalText: it.text,
        isNew: false,
        isEdited: false,
        isDeleted: false,
      }));

    default:
      // Every union member is handled – this is unreachable
      return state;
  }
}

/* COMPONENT */
export default function Agenda({ role = "participant" }: { role?: "host" | "participant" }) {
  // STATE
  // Uses a reducer to manage agenda items state
  const [items, dispatch] = useReducer(agendaReducer, []);

  // Filter out deleted items for display
  const visibleItems = items.filter(it => !it.isDeleted);


  const addItem = () => dispatch({ type: "ADD" });
  const changeItem = (id: string, txt: string) =>
    dispatch({ type: "CHANGE", id, text: txt, isEdited: true });
  const removeItem = (id: string) => dispatch({ type: "REMOVE", id });
  const resetItems = () => dispatch({ type: "RESET" });

  const MEETING_ID = 'test-meeting-id'; // Use the same meeting_id everywhere
  const saveItems = async () => {
    // Only save items that are new, edited, or deleted, and whose text is not empty
    const itemsToSave = items.filter(
      it => (it.isEdited || it.isNew || it.isDeleted) && it.text.trim() !== ""
    );

    if (itemsToSave.length === 0) {
      console.log('No items to save');
      return;
    }

    const savedItems = [];
    let hasErrors = false;

    for (const item of itemsToSave) {
      try {
        console.log('Saving agenda item:', item);
        // Temporarily use test endpoint to avoid database issues
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/agenda/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meeting_id: MEETING_ID,
            agenda_item: item.text,
            duration_seconds: 200
          })
        });
  
        const result = await response.json();
        console.log('Saved agenda item response:', result);
        
        if (result.success && result.item) {
          savedItems.push(result.item);
        } else {
          console.error('Failed to save item:', item.text, result);
          hasErrors = true;
        }
  
      } catch (error) {
        console.error('Error saving agenda item:', error);
        hasErrors = true;
      }
    }

    if (!hasErrors && savedItems.length > 0) {
      // Update the state with the saved items
      dispatch({ type: "SAVE_SUCCESS", savedItems });
      console.log('All items saved successfully');
    } else {
      console.error('Some items failed to save');
      // Optionally show an error message to the user
    }
  };

  // EFFECTS
  const [isHovered, setIsHovered] = useState(false);

  // Load initial data once per component mount
  // TO-DO: fetch agenda items from server

  // // For now, we use dummy data to simulate loading
  // useEffect(() => {
  //   const dummyData = [
  //     { id: "1", text: "Discuss UI layout" },
  //     { id: "2", text: "Plan roadmap" },
  //     { id: "3", text: "Implement authentication" },
  //   ];
  //   dispatch({ type: "LOAD", items: dummyData });
  // }, []);

  // Fetch agenda items from the backend
  useEffect(() => {
    // Temporarily use test endpoint to avoid database issues
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/agenda/test?meeting_id=${MEETING_ID}`)
      .then((res) => res.json())
      .then((data) => {
        console.log('Fetched agenda items from backend:', data.items);
        if (Array.isArray(data.items)) {
          dispatch({ type: "LOAD", items: data.items });
        } else {
          dispatch({ type: "LOAD", items: [] });
        }
      })
      .catch((error) => {
        console.error('Error fetching agenda items:', error);
        // Optionally, dispatch an error action to update UI
        dispatch({ type: "LOAD", items: [] });
      });
  }, []);

  return (
    <>
      <div className="w-[80%] relative">
        {/* Main agenda container */}
        <div className="bg-stone-400/95 p-8 rounded-lg space-y-4">
          <h2 className="font-semibold text-lg">next on the agenda…</h2>

          {/* Conditionally render: If no items, show a placeholder and an empty item, 
            otherwise list items */}

          {visibleItems.length === 0 ? (
            <>
              <AgendaItem
                renderAsDiv={true}
                item={{ id: "placeholder", text: "", originalText: "", isNew: false, isEdited: false, isDeleted: false }}
                onChange={changeItem}
                onRemove={removeItem}
              />
            </>
          ) : (
            <>
              <ul className="space-y-2 list-none mb-2">
                {visibleItems.map((item) => {
                  console.log('Passing item to AgendaItem:', item);
                  return (
                    <AgendaItem
                      key={item.id}
                      item={item}
                      onChange={changeItem}
                      onRemove={removeItem}
                      onAdd={addItem}
                      // Pass timer fields as props if needed in AgendaItem
                    />
                  );
                })}
              </ul>
            </>
          )}
          {role === "host" && <BtnAddAgendaItem onAdd={addItem} />}

          {/* Right "padding" area */}
          <div
            className={`w-[10%] h-full absolute top-0 right-0 cursor-pointer flex items-center justify-center
              ${isHovered ? 'border border-gray-300 rounded-md border-dashed' : 'bg-transparent'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <BtnAddTimersPadding isHovered={isHovered} onAddTimers={() => { }} />
          </div>

          {/* Action buttons 
          appear when: 
          - an existing item is edited / deleted
          - a new item is added && edited

          FUTURE FIX: they should not appear if a new item is edited then deleted. (not super urgent)
          */}
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