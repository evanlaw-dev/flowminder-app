import React from 'react'

function BtnNudge({ text }: { text: string }) {
  const handleClick = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_id: 'test-meeting-id',
          action_type: text.toLowerCase().replace(' ', '_') // "move along" -> "move_along", "invite to speak" -> "invite_to_speak"
        })
      });
      
      if (response.ok) {
        console.log(`${text} request sent successfully`);
        // Optionally show a success message or update UI
      } else {
        console.error(`Failed to send ${text} request`);
      }
    } catch (error) {
      console.error(`Error sending ${text} request:`, error);
    }
  };

  return (
    <button 
      className="w-[50%] bg-stone-300/95 text-white text-wrap py-4 rounded-lg shadow-md cursor-pointer hover:bg-stone-400/95 transition-colors"
      onClick={handleClick}
    >
      {text}
    </button>
  )
}

export default BtnNudge