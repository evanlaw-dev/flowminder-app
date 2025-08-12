import React from 'react' 

function NudgeWrapper() {
  return (
    <div id="nudge-wrapper" className="flex justify-between gap-2 max-w-[300px]">
      <button className="flex-grow max-w-[150px] min-w-[110px]  font-semibold bg-[var(--primary)] text-sky-900 hover:bg-sky-100 shadow-sky-500 text-wrap py-2.5 rounded-full cursor-pointer"
      >Move along</button>
      <button className="flex-grow max-w-[150px] min-w-[110px] font-semibold bg-[var(--primary)] text-sky-900 hover:bg-sky-100 shadow-sky-500 text-wrap py-2.5 rounded-full cursor-pointer"
      >Speak up</button>
    </div>
  )
}

export default NudgeWrapper