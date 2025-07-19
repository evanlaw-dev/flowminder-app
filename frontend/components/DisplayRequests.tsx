import React, { useState, useEffect } from 'react'
import Request from './Request'

function DisplayRequests() {
  const [requestCounts, setRequestCounts] = useState({
    extraTime: 0,
    moveAlong: 0
  });

  const fetchRequestCounts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/actions/test-meeting-id`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.actions) {
          const extraTimeCount = data.actions.filter((action: any) => 
            action.action_type === 'request_extra_time'
          ).length;
          const moveAlongCount = data.actions.filter((action: any) => 
            action.action_type === 'move_along'
          ).length;
          
          setRequestCounts({
            extraTime: extraTimeCount,
            moveAlong: moveAlongCount
          });
        }
      }
    } catch (error) {
      console.error('Error fetching request counts:', error);
    }
  };

  // Fetch counts on component mount and set up polling
  useEffect(() => {
    fetchRequestCounts();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchRequestCounts, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className='w-[87%] flex flex-row gap-2 p-4 pt-0 text-center'>
      <Request text="Requests for extra time" count={requestCounts.extraTime} /> 
      <Request text="Requests to move along" count={requestCounts.moveAlong} />
    </div>
  )
}

export default DisplayRequests
