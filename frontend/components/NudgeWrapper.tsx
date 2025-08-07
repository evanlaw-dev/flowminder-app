import React from 'react' 

function NudgeWrapper() {
  return (
    <div id="nudge-wrapper" className="flex justify-center gap-2">
      <button className="w-[clamp(100px,120px,150px)] font-semibold bg-[var(--primary)] text-sky-900 hover:[bg-sky-500] shadow-sky-500 text-wrap py-2.5 rounded-full cursor-pointer"
      >Move along</button>
      <button className="w-[clamp(100px,120px,150px)] font-semibold bg-[var(--primary)] text-sky-900 hover:[bg-sky-500] shadow-sky-500 text-wrap py-2.5 rounded-full cursor-pointer"
      >Speak up</button>
    </div>
  )
}

export default NudgeWrapper