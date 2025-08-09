import React from 'react' 
import BtnNudge from './BtnNudge'

interface NudgeProps {
  role?: 'host' | 'participant';
  onNudgeSent?: () => void;
}

function Nudge({ role = 'participant', onNudgeSent }: NudgeProps) {
  // Only show nudge buttons for participants
  if (role === 'host') {
    return null;
  }

  return (
    <div className='w-[87%] flex flex-row gap-2 p-4 py-0 text-center'>
        <BtnNudge 
          text="Move along" 
          nudgeType="move_along"
          className="w-[50%]"
          onNudgeSent={onNudgeSent}
        />
        <BtnNudge 
          text="Invite to Speak" 
          nudgeType="invite_speak"
          className="w-[50%]"
          onNudgeSent={onNudgeSent}
        />
    </div>
  )
}

export default Nudge