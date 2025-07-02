"use client";
import React, { useReducer } from "react";
import { v4 as uuid } from "uuid";    // TODO on backend: Generates IDs
import AgendaItem from "./AgendaItem";
import EmptyAgendaItem from "./EmptyAgendaItem";
import { useEffect } from "react";

/* TYPES */
export interface AgendaItemType {
  id: string;
  text: string;
  originalText: string;
  isNew: boolean;
  isEdited: boolean;
}

type AgendaAction =
  | { type: "LOAD"; items: { id: string; text: string }[] }
  | { type: "ADD" }
  | { type: "CHANGE"; id: string; text: string, isEdited?: boolean }
  | { type: "REMOVE"; id: string }
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
        },
      ];

    case "CHANGE":
      return state.map((it) =>
        it.id === action.id
          ? { ...it, text: action.text, isEdited: !it.isNew && action.text !== it.originalText }
          : it
      );
    case "REMOVE":
      return state.filter((it) => it.id !== action.id);

    case "RESET":
      // Drop unsaved items and revert edits on saved ones
      return state
        .filter((it) => !it.isNew)
        .map((it) => ({ ...it, text: it.originalText, isEdited: false }));

    case "SAVE_SUCCESS":
      // What comes back from the server is now the single source of truth
      return action.savedItems.map((it) => ({
        ...it,
        originalText: it.text,
        isNew: false,
        isEdited: false,
      }));

    default:
      // Every union member is handled – this is unreachable
      return state;
  }
}

/* COMPONENT */
export default function Agenda() {
  const [items, dispatch] = useReducer(agendaReducer, []);

  const addItem = () => dispatch({ type: "ADD" });
  const changeItem = (id: string, txt: string) =>
    dispatch({ type: "CHANGE", id, text: txt, isEdited: true });
  const removeItem = (id: string) => dispatch({ type: "REMOVE", id });
  const resetItems = () => dispatch({ type: "RESET" });

  const saveItems = () => {
    // TODO: Implement save logic
  };


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
      <div className="bg-gray-100 p-8 rounded-lg space-y-4">
        <h2 className="font-semibold text-lg">next on the agenda…</h2>

        {/* If no items, show a placeholder and an empty item, otherwise list items */}
        {items.length === 0 ? (
          <>
            <AgendaItem
              item = {{ id: "placeholder", text: "", originalText: "", isNew: false, isEdited: false }}
              onChange={changeItem}
              onRemove={removeItem}
            />
            <EmptyAgendaItem onAdd={addItem} />

          </>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <AgendaItem
                key={item.id}
                item={item}
                onChange={changeItem}
                onRemove={removeItem}
              />
            ))}
            <EmptyAgendaItem onAdd={addItem} />
          </ul>
        )}

        {/* Action buttons */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={resetItems}
            className="flex-1 rounded-full border border-black/10 hover:bg-gray-200 h-10 sm:h-12"
          >
            Discard changes
          </button>
          <button
            onClick={saveItems}
            className="flex-1 rounded-full bg-black text-white hover:bg-neutral-800 h-10 sm:h-12"
          >
            Save changes
          </button>
        </div>
      </div>
    </>
  );
}
