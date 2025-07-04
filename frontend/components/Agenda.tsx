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
}

type AgendaAction =
  | { type: "LOAD"; items: { id: string; text: string }[] }
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
        originalText: it.text,
        isNew: false,
        isEdited: false,
        isDeleted: false,
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
export default function Agenda() {

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

  const saveItems = () => {
    // TODO: Implement save logic
  };

  // EFFECTS
  const [isHovered, setIsHovered] = useState(false);

  // Load initial data once per component mount
  // TO-DO: fetch agenda items from server

  useEffect(() => {
    const dummyData = [
      { id: "1", text: "Discuss UI layout" },
      { id: "2", text: "Plan roadmap" },
      { id: "3", text: "Implement authentication" },
    ];
    dispatch({ type: "LOAD", items: dummyData });
  }, []);

  return (
    <>
      <div className="relative">
        {/* Main agenda container */}
        <div className="bg-gray-100 p-8 rounded-lg space-y-4">
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
                {visibleItems.map((item) => (
                  <AgendaItem
                    key={item.id}
                    item={item}
                    onChange={changeItem}
                    onRemove={removeItem}
                  />
                ))}
              </ul>
            </>
          )}
          <BtnAddAgendaItem onAdd={addItem} />

          {/* Right "padding" area */}
          <div
            className={`w-[10%] h-full absolute top-0 right-0 cursor-pointer flex items-center justify-center
              ${isHovered ? 'border border-gray-300 rounded-md border-dashed' : 'bg-transparent'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <BtnAddTimersPadding isHovered={isHovered} onAddTimers={() => { }} />
          </div>

          {/* Action buttons */}
          {items.filter((item) => item.isEdited || item.isDeleted).length > 0 && (
            <div className="flex">
              <button
                onClick={resetItems}
                className="flex-1 rounded-full border border-black/10 hover:bg-gray-200 h-10 sm:h-12"
              >
                Cancel
              </button>
              <button
                onClick={saveItems}
                className="flex-1 rounded-full bg-black text-white hover:bg-neutral-800 h-10 sm:h-12"
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