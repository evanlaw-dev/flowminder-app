import React from 'react' 
import BtnNudge from './BtnNudge'

function Nudge() {
  return (
    <div className='w-[87%] flex flex-row gap-2 p-4 py-0 text-center'>
        <BtnNudge text="Move along" />
        <BtnNudge text="Invite to Speak" />
    </div>
  )
}

export default Nudge