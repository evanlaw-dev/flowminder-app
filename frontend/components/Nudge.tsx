import React from 'react' 
import BtnNudge from './BtnNudge'

function Nudge() {
  return (
    <div className='flex-shrink-0 flex flex-row gap-1 text-center'>
        <BtnNudge text="Move along" />
        <BtnNudge text="Invite to Speak" />
    </div>
  )
}

export default Nudge