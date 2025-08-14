// frontend/app/MeetingSession/[user_id]/[meeting_id]/page.tsx
'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import ZoomVideo from '@zoom/videosdk';
import ZoomMtgEmbedded from '@zoom/meetingsdk/embedded';

// Minimal types for the Embedded Client
interface EmbeddedClientInitOpts {
  zoomAppRoot: HTMLElement;
  language?: string;
}
interface EmbeddedClientJoinOpts {
  sdkKey: string;
  signature: string;
  meetingNumber: string;
  userName: string;
  passWord?: string;
  zak?: string;
}
// embedded client interface of the Zoom Meeting SDK
interface EmbeddedClient {
  init: (opts: EmbeddedClientInitOpts) => Promise<void> | void;
  join: (opts: EmbeddedClientJoinOpts) => Promise<void> | void;
  leave: () => Promise<void> | void;
}

// Zoom Video SDK client interface
export default function SessionPage() {
  const { meeting_id, user_id } = useParams<{ meeting_id: string; user_id: string }>();
  const searchParams = useSearchParams();
  // State for managing meeting state used for joining/leaving
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  // User details
  const userName = searchParams.get('name') || 'FlowMinder User';
  const role = Number(searchParams.get('role') || '1'); // 1 = host, 0 = attendee
  const mode = (searchParams.get('use') || 'meeting').toLowerCase(); // 'meeting' | 'video'

  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
  const sdkKey = process.env.NEXT_PUBLIC_ZOOM_SDK_KEY as string;

  // DOM refs
  const meetingRootRef = useRef<HTMLDivElement | null>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Embedded Meeting SDK client (Component View)
  const embeddedClientRef = useRef<EmbeddedClient | null>(null);

  // Ensure the embedded client is initialized
  const ensureClient = (): EmbeddedClient => {
    if (!embeddedClientRef.current) {
      embeddedClientRef.current = ZoomMtgEmbedded.createClient() as unknown as EmbeddedClient;
    }
    return embeddedClientRef.current;
  };

  // ---- Meeting SDK (Embedded / Component View) ----
  const startMeetingSdk = async () => {
    try {
      setJoining(true);
      const meetingNumber = String(meeting_id);

      // 1) Signature
      const sigRes = await fetch(`${backend}/zoom/sdk-signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingNumber, role }),
      });
      const { signature } = (await sigRes.json()) as { signature?: string };
      if (!signature) throw new Error('No Meeting SDK signature');

      // 2) ZAK for host
      let zak: string | undefined;
      if (role === 1) {
        const zakRes = await fetch(`${backend}/zoom/zak?userId=${encodeURIComponent(String(user_id))}`);
        const zakData = (await zakRes.json()) as { zak?: string };
        zak = zakData?.zak;
        if (!zak) throw new Error('Missing ZAK for host; re-auth via OAuth');
      }

      // 3) Init + Join via Component View
      const client = ensureClient();
      const rootEl = meetingRootRef.current;
      if (!rootEl) throw new Error('Missing meeting root element');
      
      // Initialize the embedded client and join the meeting
      await client.init({ zoomAppRoot: rootEl, language: 'en-US' });
      await client.join({
        sdkKey,
        signature,
        meetingNumber,
        userName,
        passWord: '',
        zak,
      });

      setJoined(true);
    } catch (e) {
      console.error('Meeting SDK (embedded) join failed:', e);
      alert('Failed to embed Zoom meeting');
    } finally {
      setJoining(false);
    }
  };

  // ---- Video SDK (alt/testing) ----
  const startVideoSdk = async () => {
    const client = ZoomVideo.createClient();
    const sessionName = role === 1 ? `${meeting_id}-vsdk-${Date.now()}` : String(meeting_id);

    try {
      setJoining(true);
      const sigRes = await fetch(`${backend}/zoom/video-signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionName, role }),
      });
      const { signature } = (await sigRes.json()) as { signature?: string };
      if (!signature) throw new Error('No Video SDK signature');

      await client.init('en-US', 'CDN');
      await client.join(sessionName, signature, userName, '');

      const stream = client.getMediaStream();
      try { await stream.startAudio(); } catch (err) { console.warn('startAudio failed', err); }
      try { await stream.startVideo(); } catch (err) { console.warn('startVideo failed', err); }

      const self = client.getCurrentUserInfo();
      if (videoCanvasRef.current) {
        await stream.renderVideo(videoCanvasRef.current, self.userId, 640, 360, 0, 0, 3);
      }

      setJoined(true);
    } catch (e) {
      console.error('Video SDK join failed:', e);
      alert('Failed to join Video session');
    } finally {
      setJoining(false);
    }
  };
  // Leave the current session
  // This works for both Video SDK and Meeting SDK
  // For Video SDK, it will leave the session and stop the media stream
  // For Meeting SDK, it will leave the embedded meeting
  const leave = async () => {
    try {
      if (mode === 'video') {
        const client = ZoomVideo.createClient();
        await client.leave();
      } else if (embeddedClientRef.current) {
        await embeddedClientRef.current.leave();
      }
      setJoined(false);
    } catch (e) {
      console.error('Leave failed', e);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl mb-2">{mode === 'video' ? 'Zoom Video SDK — Session' : 'Zoom Meeting SDK — Embedded Meeting (Component View)'}</h1>

      <div className="mb-3 flex gap-2">
        {!joined ? (
          <button
            onClick={mode === 'video' ? startVideoSdk : startMeetingSdk}
            disabled={joining}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg"
          >
            {joining ? 'Joining…' : 'Join'}
          </button>
        ) : (
          <button onClick={leave} className="px-6 py-3 bg-gray-700 text-white rounded-lg">Leave</button>
        )}
      </div>

      {/* Component View mount point */}
      {mode !== 'video' && (
        <div ref={meetingRootRef} className="w-[960px] h-[540px] bg-black rounded overflow-hidden" />
      )}

      {/* Video SDK canvas */}
      {mode === 'video' && (
        <canvas ref={videoCanvasRef} id="video-canvas" className="bg-black rounded" width={640} height={360} />
      )}

      <div className="mt-4 text-sm text-gray-600">
        <div><b>Mode:</b> {mode === 'video' ? 'Video SDK' : 'Meeting SDK (embedded) — Component View'}</div>
        <div><b>Meeting ID:</b> {String(meeting_id)}</div>
        <div><b>User:</b> {userName}</div>
        <div><b>Role:</b> {role === 1 ? 'Host' : 'Attendee'}</div>
      </div>
    </div>
  );
}