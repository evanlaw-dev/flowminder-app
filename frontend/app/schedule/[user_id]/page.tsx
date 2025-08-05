'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import Agenda from '@/components/Agenda';

export default function SchedulePage() {
  const router = useRouter();
  const { user_id: zoomUserId } = useParams();
  const [topic, setTopic] = useState('');
  const [startTime, setStartTime] = useState(
    new Date().toISOString().slice(0,16) // YYYY-MM-DDThh:mm
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    // grab agenda items from your store
    const agendaItems = await window.localStorage.getItem('agendaItems'); 
    // (or import your store directly)

    const res = await fetch('/api/meetings/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: zoomUserId,
        topic,
        startTime,
        agendaItems, 
      }),
    });

    if (!res.ok) {
      alert('Failed to schedule meeting');
      setLoading(false);
      return;
    }
    await res.json();
    // const { meetingId } = await res.json();
    // redirect back to your host hub
    router.push(`/meeting/${zoomUserId}`);
  };

  return (
    <div className="flex h-screen">
      {/* — Left: Schedule Form — */}
      <div className="w-1/3 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Schedule a Zoom Meeting</h2>
        <label className="block">
          <span className="text-sm">Topic</span>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="mt-1 w-full border rounded px-2 py-1"
          />
        </label>
        <label className="block">
          <span className="text-sm">Start Time</span>
          <input
            type="datetime-local"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            className="mt-1 w-full border rounded px-2 py-1"
          />
        </label>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`mt-4 w-full py-2 rounded text-white ${
            loading ? 'bg-gray-400' : 'bg-green-600'
          }`}
        >
          {loading ? 'Scheduling…' : 'Schedule Meeting'}
        </button>
      </div>

      {/* — Right: Your Agenda Builder — */}
      <div className="w-2/3 bg-stone-100 p-6 overflow-auto">
        <Agenda role="host" />
      </div>
    </div>
  );
}