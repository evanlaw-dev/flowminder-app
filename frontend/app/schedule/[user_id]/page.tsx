'use client';

import { useAgendaStore } from '@/stores/useAgendaStore';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Agenda from '@/components/Agenda';

export default function SchedulePage() {
  const { user_id: zoomUserId } = useParams();
  const { items } = useAgendaStore();
  const [topic, setTopic] = useState('');
  const [startTime, setStartTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [meetingInfo, setMeetingInfo] = useState<null | {
    meetingId: number | string;
    topic?: string;
    start_time?: string;
    timezone?: string;
    start_url?: string;
    join_url?: string;
  }>(null);

  // Pre-fill the datetime-local with "now" (uses local time format YYYY-MM-DDTHH:MM)
  useEffect(() => {
    setStartTime(new Date().toISOString().slice(0, 16));
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_BACKEND_URL as string;
      if (!base) throw new Error('Missing NEXT_PUBLIC_BACKEND_URL');

      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Map agenda store items into the shape backend expects
      const agenda = items.map(it => ({
        agenda_item: it.text,
        duration_seconds: it.timerValue,
      }));

      const res = await fetch(`${base}/api/meetings/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: zoomUserId as string,
          topic,
          startTime,     // backend converts to ISO(UTC)
          items: agenda, // backend also accepts agendaItems string; either works
          timeZone,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('Create meeting failed:', err);
        alert('Failed to schedule meeting');
        return;
      }

      const data = await res.json(); // { success, meetingId, ... }
      setMeetingInfo(data);
      setScheduled(true);
    } catch (e) {
      console.error(e);
      alert('Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };
  const copyJoinLink = async () => {
    if (!meetingInfo?.join_url) return;
    try {
      await navigator.clipboard.writeText(meetingInfo.join_url);
      alert('Join link copied to clipboard');
    } catch {
      alert('Could not copy link');
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
        console.error(err);
        alert('Failed to sync agenda to Zoom');
        return;
      }
      alert('Agenda synced to your next Zoom meeting.');
    } catch (e) {
      console.error(e);
      alert('Could not sync agenda');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen box-border p-6">
      <div className="bg-white dark:bg-black p-6 rounded-lg w-full max-w-3xl">
        {scheduled && meetingInfo ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-black">Meeting scheduled ✅</h2>
            <div className="text-sm text-black">
              <div><span className="font-medium">Topic:</span> {meetingInfo.topic || topic || 'FlowMinder Meeting'}</div>
              <div>
                <span className="font-medium">When:</span>{' '}
                {meetingInfo.start_time
                  ? new Date(meetingInfo.start_time).toLocaleString(undefined, {
                      dateStyle: 'full', timeStyle: 'short'
                    })
                  : new Date(startTime).toLocaleString()}
                {meetingInfo.timezone ? ` (${meetingInfo.timezone})` : ''}
              </div>
              <div><span className="font-medium">Meeting ID:</span> {String(meetingInfo.meetingId)}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => meetingInfo.start_url && (window.location.href = meetingInfo.start_url)}
                className="px-4 py-2 rounded bg-green-600 text-white"
              >Open host link</button>
              <button
                onClick={copyJoinLink}
                className="px-4 py-2 rounded bg-stone-700 text-white"
              >Copy join link</button>
            </div>
          </div>
        ) : (
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
                className={`mt-4 w-full py-2 rounded text-white ${loading ? 'bg-gray-400' : 'bg-green-600'}`}
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
        )}
      </div>
    </div>
  );
}