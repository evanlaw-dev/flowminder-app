import { FaMinus } from 'react-icons/fa';
import { FaPlus } from 'react-icons/fa6';

export default function BtnDisplayAllTimers({ showTimers }: { showTimers: boolean }) {
    return (
        <div className="relative inline-flex items-center justify-center p-4 group">
            {showTimers ? (
                <>
                    <FaMinus className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    <div className="absolute top-full right-0 mt-1 bg-red-900 text-white text-sm rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        Remove Timers
                    </div>
                </>
            ) : (
                <>
                    <FaPlus className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    <div className="absolute top-full right-0 mt-1 bg-red-900 text-white text-sm rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        Add Timers
                    </div>
                </>
            )}
        </div>
    );
}
