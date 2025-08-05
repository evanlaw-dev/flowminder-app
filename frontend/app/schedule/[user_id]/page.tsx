'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Agenda from '@/components/Agenda';

export default function SchedulePage() {
  const router = useRouter();
  const { user_id: zoomUserId } = useParams();
  const [topic, setTopic] = useState('');
  const [startTime, setStartTime] = useState(
    new Date().toISOString().slice(0,16) // YYYY-MM-DDThh:mm
  );
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false); // to ensure the component is mounted before 

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setStartTime(new Date().toISOString().slice(0,16));
  }, []);

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

  if (!mounted) {
    return null;
  }
  return (
    <div className="flex flex-col items-center justify-center h-screen box-border p-6">
      <div className="bg-white dark:bg-black p-6 rounded-lg w-full max-w-3xl">
        <div className="flex h-[70vh] justify-end gap-8">
          {/* LEFT FORM */}
          <div className="w-1/3 p-4 space-y-4">
            <h2 className="text-xl font-semibold text-black dark:text-black">Schedule a Zoom Meeting</h2>
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
              {/* this is the calendar/meeting time input */}
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
          {/* RIGHT AGENDA */}
          <div className="w-1/2 overflow-auto">
            <Agenda role="host" />
          </div>
        </div>
      </div>
    </div>
  );
}