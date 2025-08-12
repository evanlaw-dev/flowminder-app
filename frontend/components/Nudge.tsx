import React from 'react';
import BtnNudge from './BtnNudge';
import '../app/globals.css';


interface NudgeProps {
  role?: 'host' | 'participant';
  onNudge: () => void;
}

const btnBase = [
  'flex-grow',
  'max-w-[150px]',
  'min-w-[110px]',
  'font-semibold',
  'bg-[var(--primary)]',
  'text-sky-950',
  'hover:bg-sky-50',
  'hover:text-sky-950',
  'shadow',
  'shadow-sky-950',
  'text-wrap',
  'py-2.5',
  'rounded-full',
  'cursor-pointer'
].join(' ');

function Nudge({ role = 'participant', onNudge }: NudgeProps) {
  // Only show nudge buttons for participants
  if (role === 'host') return null;

  return (
    <div id="nudge-wrapper" className="flex justify-between gap-2 max-w-[300px]">
      <BtnNudge
        text="Move along"
        nudgeType="move_along"
        className={btnBase}
        onNudgeSent={onNudge}
      />
      <BtnNudge
        text="Speak up"
        nudgeType="invite_speak"
        className={btnBase}
        onNudgeSent={onNudge}
      />
    </div>
  );
}

export default Nudge;
