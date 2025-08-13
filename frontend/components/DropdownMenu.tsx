import { useState, useRef, useEffect } from 'react';
import { Edit, Clock8, ClockAlert, Trash2 } from 'lucide-react';
import Image from "next/image";
import { useAgendaStore } from '@/stores/useAgendaStore';

export default function DropdownMenu() {
    const { showAllTimers, toggleAllTimers, toggleEditingMode } = useAgendaStore();
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

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
                    <div onClick={() => {toggleEditingMode(); setOpen(!open);}} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                    </div>
                    <div onClick={() => {toggleAllTimers(); setOpen(!open);}} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                        {showAllTimers ? (
                            <>
                                <ClockAlert className="w-4 h-4" />
                                <span>Remove Timers</span>
                            </>
                        ) : (
                            <>
                                <Clock8 className="w-4 h-4" />
                                <span>Add Timers</span>
                            </>
                        )}              
                    </div>
                    <div className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg cursor-pointer text-red-500 disabled">
                        <Trash2 className="w-4 h-4" />
                        <span>Delete All</span>
                    </div>
                </div>
            )}
        </div>
    );
}


