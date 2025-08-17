import React from 'react'
import { sendNudge } from '../services/participantService'

interface BtnNudgeProps {
  text: string;
  nudgeType: 'move_along' | 'invite_speak';
  className?: string;
  onNudgeSent?: () => void; // Callback to trigger immediate refresh
}

function BtnNudge({ text, nudgeType, className = "", onNudgeSent }: BtnNudgeProps) {
  const handleClick = async () => {
    const startTime = Date.now();
    console.log(`Starting to send ${nudgeType} nudge at ${startTime}`);
    
    try {
      const success = await sendNudge({
        meeting_id: 'a8f52a02-5aa8-45ec-9549-79ad2a194fa4',
        participant_id: 10, // Default participant
        nudge_type: nudgeType,
        message: text
      });

      const endTime = Date.now();
      console.log(`${nudgeType} nudge completed in ${endTime - startTime}ms`);

      if (success) {
        console.log(`Nudge "${text}" sent successfully`);
        // Trigger immediate refresh
        if (onNudgeSent) {
          onNudgeSent();
        }
      } else {
        console.error('Failed to send nudge');
      }
    } catch (error) {
      console.error('Error sending nudge:', error);
    }
  };

  return (
    <button 
      className={`${className}`}
      onClick={handleClick}
      title={`Send ${nudgeType} nudge`}
    >
      {text}
    </button>
  )
}

export default BtnNudge