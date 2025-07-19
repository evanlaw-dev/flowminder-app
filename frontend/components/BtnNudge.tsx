import React from 'react'

function BtnNudge({ text }: { text: string }) {
  const handleClick = async () => {
    console.log('Button clicked:', text);
    console.log('Backend URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
    
    try {
      const actionType = text.toLowerCase().replace(/\s+/g, '_');
      console.log('Action type:', actionType);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_id: 'test-meeting-id',
          action_type: actionType
        })
      });
      
      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response result:', result);
      
      if (response.ok) {
        console.log(`${text} request sent successfully`);
        alert(`${text} request sent successfully!`);
      } else {
        console.error(`Failed to send ${text} request`);
        alert(`Failed to send ${text} request`);
      }
    } catch (error) {
      console.error(`Error sending ${text} request:`, error);
      alert(`Error sending ${text} request: ${error}`);
    }
  };

  return (
    <button 
      className="w-[50%] bg-blue-500 text-white text-wrap py-4 rounded-lg shadow-md cursor-pointer hover:bg-blue-600 transition-colors font-semibold"
      onClick={handleClick}
      style={{ pointerEvents: 'auto' }}
    >
      {text}
    </button>
  )
}

export default BtnNudge