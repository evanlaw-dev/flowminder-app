'use client';

import { useAgendaStore } from '@/stores/useAgendaStore';

// import { useRouter, useParams } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Agenda from '@/components/Agenda';

export default function SchedulePage() {
  // const router = useRouter();
  const { user_id: zoomUserId } = useParams();
  const { items } = useAgendaStore();
  const [topic, setTopic] = useState('');
  const [startTime, setStartTime] = useState('');
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
    try {
      const base = process.env.NEXT_PUBLIC_BACKEND_URL as string;
      if (!base) {
        alert('Missing NEXT_PUBLIC_BACKEND_URL');
        setLoading(false);
        return;
      }
  
      // 1) fetch schedules for this Zoom user
      const s = await fetch(`${base}/zoom/schedules?userId=${zoomUserId}`);
      if (!s.ok) { alert('No schedules found'); setLoading(false); return; }
      const schedules = await s.json();
      console.log('list schedules resp', schedules);
      
      const list = Array.isArray(schedules?.items)
        ? schedules.items
        : Array.isArray(schedules?.schedules)
          ? schedules.schedules
          : [];
      
      if (!list.length) { alert('No schedule available'); setLoading(false); return; }
      
      const scheduleId = list[0]?.schedule_id || list[0]?.id;
      if (!scheduleId) { alert('No schedule available'); setLoading(false); return; }
  
      // 2) mint a single-use link and redirect to Zoom booking page
      const res = await fetch(`${base}/zoom/schedules/${scheduleId}/single-use-link?userId=${zoomUserId}`, { method: 'POST' });
      if (!res.ok) { alert('Failed to create scheduling link'); setLoading(false); return; }
      const { scheduling_url } = await res.json();
      window.location.href = scheduling_url;
    } catch (err) {
      console.error(err);
      alert('Something went wrong scheduling');
    } finally {
      setLoading(false);
    }
  };


  const handleSyncAgenda = async () => {
    try {
      const base = process.env.NEXT_PUBLIC_BACKEND_URL as string;
      const payload = { items: items.map(it => ({ agenda_item: it.text, duration_seconds: it.timerValue })) };
      const resp = await fetch(`${base}/zoom/meetings/append-agenda?userId=${zoomUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const err = await resp.text();
        alert('Failed to sync agenda to Zoom');
        console.error(err);
        return;
      }
      alert('Agenda synced to your next Zoom meeting.');
    } catch (e) {
      console.error(e);
      alert('Could not sync agenda');
    }
  };
  // const handleSubmit = async () => {
  //   setLoading(true);
  //   // grab agenda items from your store
  //   const agendaItems = await window.localStorage.getItem('agendaItems'); 
  //   // (or import your store directly)

  //   const res = await fetch(
  //     `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/meetings/schedule`,
  //     {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         userId: zoomUserId,
  //         topic,
  //         startTime,
  //         agendaItems, 
  //       }),
  //     }
  //   );

  //   if (!res.ok) {
  //     alert('Failed to schedule meeting');
  //     setLoading(false);
  //     return;
  //   }
  //   await res.json();
  //   // const { meetingId } = await res.json();
  //   // redirect back to your host hub
  //   router.push(`/meeting/${zoomUserId}`);
  // };

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
            <button
              onClick={handleSyncAgenda}
              className="mt-2 w-full py-2 rounded text-white bg-blue-600"
            >
              Sync Agenda to Next Zoom Meeting
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