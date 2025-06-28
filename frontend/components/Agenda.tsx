"use client";
import AgendaItem from './AgendaItem';

/*This component holds the editable list 
where users can add, edit, and remove items.*/

function Agenda() {  
  return (
    <div className="bg-gray-100 p-8 rounded-lg">
        <h2>next on the agenda...</h2>

          {/*if the list is empty, show a placeholder item
          else, map over the list and render AgendaItem for each item*/}

        <AgendaItem />
         <div className="flex justify-center items-center gap-4 mt-4 w-full">
            <button
              className="flex-1 text-center rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto min-w-[40%]"
            >
              Discard changes
            </button>
            <button
              className="flex-1 text-center rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto min-w-[40%]"
            >
              Save changes
            </button>
          </div>
    </div>


  );
}

export default Agenda;

