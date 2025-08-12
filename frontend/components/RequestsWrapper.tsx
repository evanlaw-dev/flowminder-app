import React, { useState, useEffect } from 'react'
import Request from './Request'
import { getNudgeStats } from '@/services/participantService'

// Function to reset nudge stats
async function resetNudgeStats(meetingId: string): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:4000/nudge-stats?meeting_id=${meetingId}`, {
      method: 'DELETE'
    });
    return response.ok;
  } catch (error) {
    console.error('Error resetting nudge stats:', error);
    return false;
  }
}

interface RequestsWrapperProps {
  refreshTrigger?: number;
  role?: 'host' | 'participant';
}

function RequestsWrapper({ refreshTrigger = 0, role = 'participant' }: RequestsWrapperProps) {
  const [nudgeStats, setNudgeStats] = useState({
    move_along_count: 0,
    invite_speak_count: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const meetingId = 'a8f52a02-5aa8-45ec-9549-79ad2a194fa4'; // This should come from props or context

  useEffect(() => {
    const fetchNudgeStats = async () => {
      try {
        const stats = await getNudgeStats(meetingId);
        setNudgeStats(stats);
      } catch (error) {
        console.error('Failed to fetch nudge stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNudgeStats();
  }, [meetingId, refreshTrigger]); // Added refreshTrigger dependency

  // Refresh stats when nudges are sent (you could add Socket.IO listener here)
  useEffect(() => {
    // For now, refresh periodically; can be replaced with Socket.IO later
    const interval = setInterval(() => {
      fetchNudgeStats();
    }, 1000); // Reduced to 1000ms for faster updates

    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchNudgeStats = async () => {
    const startTime = Date.now();
    try {
      console.log('Fetching nudge stats for meeting:', meetingId);
      const stats = await getNudgeStats(meetingId);
      const endTime = Date.now();
      console.log(`Received nudge stats in ${endTime - startTime}ms:`, stats);
      setNudgeStats(stats);
    } catch (error) {
      console.error('Failed to fetch nudge stats:', error);
    }
  };

  const handleReset = async () => {
    const success = await resetNudgeStats(meetingId);
    if (success) {
      console.log('Nudge stats reset successfully');
      fetchNudgeStats(); // Refresh immediately
    } else {
      alert('Failed to reset nudge stats');
    }
  };

  if (isLoading) {
    return (
      <div className='w-[87%] flex flex-col gap-2 p-4 pt-0'>
        <div className='flex flex-row gap-2 text-center'>
          <div className="w-[50%] bg-stone-700/95 text-white text-wrap p-4 rounded-lg shadow-md">
            <h2 className="text-md font-semibold mb-2">Loading...</h2>
          </div>
          <div className="w-[50%] bg-stone-700/95 text-white text-wrap p-4 rounded-lg shadow-md">
            <h2 className="text-md font-semibold mb-2">Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='w-[87%] flex flex-col gap-2 p-4 pt-0'>
      <div className='flex flex-row gap-2 text-center'>
        <Request text="Move along nudges" count={nudgeStats.move_along_count} /> 
        <Request text="Invite to speak nudges" count={nudgeStats.invite_speak_count} />
      </div>
      {role === 'host' && (
        <button 
          onClick={handleReset}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
          title="Reset all nudge counters to 0"
        >
          Reset Counters
        </button>
      )}
    </div>
  )
}

export default RequestsWrapper
