'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import ZoomVideo from '@zoom/videosdk';

export default function VideoSessionPage() {
  const { meeting_id } = useParams();
  const searchParams = useSearchParams();
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const videoRef = useRef<HTMLCanvasElement | null>(null);

  // Treat `meeting_id` as the Video SDK session name
  const sessionName = String(meeting_id);
  const userName = searchParams.get('name') || 'FlowMinder User';
  const role = Number(searchParams.get('role') || '1'); // host by default for dev

  const authEndpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/zoom/video-signature`;

  const client = ZoomVideo.createClient();

  const startSession = async () => {
    try {
      setJoining(true);
      // Get Video SDK signature
      const sigRes = await fetch(authEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionName, role }),
      });
      const { signature } = await sigRes.json();
      if (!signature) throw new Error('No signature from server');

      // init + join
      await client.init('en-US', 'CDN');
      await client.join(sessionName, signature, userName);

      // Start local media and render self view
      const stream = client.getMediaStream();
      try { await stream.startAudio(); } catch (e) { console.warn('startAudio failed', e); }
      try { await stream.startVideo(); } catch (e) { console.warn('startVideo failed', e); }
      
      const self = client.getCurrentUserInfo();
      if (videoRef.current) {
        // width, height, x, y, renderMode (3 = contain)
        await stream.renderVideo(videoRef.current, self.userId, 640, 360, 0, 0, 3);
      }

      setJoined(true);
    } catch (e) {
      console.error('Video SDK join failed:', e);
      alert('Failed to join Video session');
    } finally {
      setJoining(false);
    }
  };

  // Leave the session and clear video container
  const leaveSession = async () => {
    try {
      await client.leave();
      setJoined(false);
      if (videoRef.current) {
        videoRef.current.innerHTML = '';
      }
    } catch (e) {
      console.error('Leave failed', e);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl mb-4">Zoom Video SDK — Next.js Session</h1>
      <div className="mb-4 flex gap-2">
        {!joined ? (
          <button
            onClick={startSession}
            disabled={joining}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg"
          >
            {joining ? 'Joining…' : 'Join Session'}
          </button>
        ) : (
          <button
            onClick={leaveSession}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg"
          >
            Leave
          </button>
        )}
      </div>

      {/* <div
        ref={videoRef}
        id="video-container"
        className="w-[640px] h-[360px] bg-black rounded"
      /> */}
      {/* Video canvas for rendering zoom video */}
      <canvas
        ref={videoRef}
        id="video-canvas"
        className="bg-black rounded"
        width={640}
        height={360}
      />

      <div className="mt-4 text-sm text-gray-600">
        <div><b>Session:</b> {sessionName}</div>
        <div><b>User:</b> {userName}</div>
        <div><b>Role:</b> {role === 1 ? 'Host' : 'Attendee'}</div>
      </div>
    </div>
  );
}