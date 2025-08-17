import { useState, useRef, useEffect } from 'react';
import { Edit, Clock8, ClockAlert, Trash2 } from 'lucide-react';
import Image from "next/image";
import { useAgendaStore } from '../stores/useAgendaStore';
import { clearAllAgendaItemsFromDB } from '../services/agendaService';

export default function DropdownMenu() {
    const { hasTimers, isEditingMode, toggleEditingMode, toggleSettings, setAreTimersAdded, areTimersAdded } = useAgendaStore();
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    async function handleDeleteAll() {
        const confirmed = confirm("This will permanently delete all agenda items. Are you sure?");
        if (!confirmed) return;

        try {
            await clearAllAgendaItemsFromDB();
            useAgendaStore.getState().clearAgendaItems(); // type-safe, returns void
        } catch (err) {
            console.error("Failed to delete agenda items:", err);
        }
    }

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    return (
        <div className="relative z-10">
            <button
                onClick={() => setOpen(!open)}
                className="pl-2 py-2 text-white rounded-lg cursor-pointer"
            >
                <Image
                    src="/ellipsis-vertical-solid-full.svg"
                    alt="Next"
                    width={24}
                    height={24}
                    className="w-6 h-6 min-h-[18px] min-w-[18px]"
                />
            </button>
            {open && (
                <div
                    ref={menuRef}
                    className="absolute top-full right-0 mr-2 w-48 bg-white shadow-lg rounded-2xl p-2"
                >
                    {!isEditingMode &&
                        <div onClick={() => { toggleEditingMode(); setOpen(!open); }} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                        </div>}
                    <div
                        onClick={() => {
                            if (hasTimers) {
                                setOpen(!open);
                                toggleSettings();
                            } else {
                                setAreTimersAdded(true);
                                setOpen(true);
                                toggleSettings();
                            }
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer group"
                    >
                        {hasTimers || areTimersAdded ? (
                            <div className="flex gap-2 items-center">
                                <ClockAlert className="w-4 h-4" />
                                <span>Timer Settings</span>
                            </div>
                        ) : (
                            <div className="flex gap-2 items-center">
                                <Clock8 className="w-4 h-4" />
                                <span>Add Timers</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg cursor-pointer text-red-500 disabled"
                        onClick={() => { handleDeleteAll(); setOpen(!open) }}
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete All</span>
                    </div>
                </div>
            )}
        </div>
    );
}


