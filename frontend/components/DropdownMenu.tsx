import { useState, useRef, useEffect } from 'react';
import { Edit, Eye, Trash2 } from 'lucide-react';
import Image from "next/image";


export default function DropdownMenu() {
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
        <div className="relative flex justify-end z-10">
            <button
                onClick={() => setOpen(!open)}
                className="px-4 py-2 text-white rounded-lg cursor-pointer"
            >
                <Image
                    src="/ellipsis-vertical-solid-full.svg"
                    alt="Next"
                    width={24}
                    height={24}
                    className="h-full"
                />
            </button>
            {open && (
                <div
                    ref={menuRef}
                    className="absolute top-full right-0 mr-2 w-48 bg-white shadow-lg rounded-2xl p-2"
                >
                    <div className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                        <Eye className="w-4 h-4" />
                        <span>Visibility Settings</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg cursor-pointer text-red-500">
                        <Trash2 className="w-4 h-4" />
                        <span>Delete All</span>
                    </div>
                </div>
            )}
        </div>
    );
}
