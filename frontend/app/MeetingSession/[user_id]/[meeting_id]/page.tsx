// frontend/app/MeetingSession/[user_id]/[meeting_id]/page.tsx
'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import ZoomVideo from '@zoom/videosdk';

// Zoom Meeting SDK types
interface ZoomMtgType {
  setZoomJSLib: (path: string, subdir: string) => void;
  preLoadWasm?: () => void;
  prepareJssdk?: () => void;
  init: (opts: {
    leaveUrl: string;
    isSupportAV?: boolean;
    disableRecord?: boolean;
    meetingSDKElement?: HTMLElement;
    success: () => void;
    error: (err: unknown) => void;
  }) => void;
  join: (opts: {
    signature: string;
    sdkKey: string;
    meetingNumber: string;
    userName: string;
    passWord?: string;
    zak?: string;
    success: () => void;
    error: (err: unknown) => void;
  }) => void;
}

/**
 * Embed Zoom Meeting (Meeting SDK) using OAuth + ZAK for host
 * - Default: Meeting SDK (embedded Zoom UI)
 * - Alt: add `?use=video` to use Video SDK (for ad‑hoc tests)
 */

// This page is the entry point for a Zoom meeting session, either embedded or using the Video SDK.
// It handles joining the meeting based on the provided user ID and meeting ID from the URL parameters
export default function SessionPage() {
  const { meeting_id, user_id } = useParams<{ meeting_id: string; user_id: string }>();
  const searchParams = useSearchParams();

  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  // Get user name and role from search params
  const userName = searchParams.get('name') || 'FlowMinder User';
  const role = Number(searchParams.get('role') || '1'); // 1 = host, 0 = attendee
  const mode = (searchParams.get('use') || 'meeting').toLowerCase(); // 'meeting' | 'video'

  // Ensure meeting_id and user_id are valid
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
  const sdkKey = process.env.NEXT_PUBLIC_ZOOM_SDK_KEY as string; // keep env as-is

  // Video SDK canvas ref (alt mode)
  const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  // Meeting SDK container (embed target)
  const meetingRootRef = useRef<HTMLDivElement | null>(null);

  // Meeting SDK (default mode)
  const startMeetingSdk = async () => {
    try {
      setJoining(true);
      const meetingNumber = String(meeting_id);

      // 1) Meeting SDK signature
      const sigRes = await fetch(`${backend}/zoom/sdk-signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingNumber, role }),
      });
      const { signature } = await sigRes.json();
      if (!signature) throw new Error('No Meeting SDK signature');

      // get ZAK for host - ZAK is required for host to join meetings with Meeting SDK
      let zak: string | undefined;
      if (role === 1) {
        const zakRes = await fetch(`${backend}/zoom/zak?userId=${encodeURIComponent(String(user_id))}`);
        const zakData = await zakRes.json();
        zak = zakData?.zak;
        if (!zak) throw new Error('Missing ZAK for host; re-auth via OAuth');
      }

      // Load Meeting SDK and embed
      const mod = await import('@zoom/meetingsdk');
      const ZoomMtg: ZoomMtgType = (mod as unknown as { ZoomMtg: ZoomMtgType }).ZoomMtg;

      // Set Zoom Meeting SDK library path
      ZoomMtg.setZoomJSLib('https://source.zoom.us/4.0.0/lib', '/av');
      if (typeof ZoomMtg.preLoadWasm === 'function') ZoomMtg.preLoadWasm();
      if (typeof ZoomMtg.prepareJssdk === 'function') ZoomMtg.prepareJssdk();

      // Initialize the Meeting SDK
      await new Promise<void>((resolve, reject) => {
        ZoomMtg.init({
          leaveUrl: window.location.origin,
          isSupportAV: true,
          disableRecord: true,
          meetingSDKElement: meetingRootRef.current ?? undefined,
          success: resolve,
          error: (err: unknown) => reject(err),
        });
      });

      await new Promise<void>((resolve, reject) => {
        ZoomMtg.join({
          signature,
          sdkKey,
          meetingNumber,
          userName,
          passWord: '', // include if your meeting has a passcode
          zak, // only for host
          success: resolve,
          error: (err: unknown) => reject(err),
        });
      });

      setJoined(true);
    } catch (e) {
      console.error('Meeting SDK join failed:', e);
      alert('Failed to embed Zoom meeting');
    } finally {
      setJoining(false);
    }
  };

  // Video SDK (alt/testing)
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
      const { signature } = await sigRes.json();
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

  return (
    <div className="p-6">
      <h1 className="text-xl mb-2">
        {mode === 'video' ? 'Zoom Video SDK — Session' : 'Zoom Meeting SDK — Embedded Meeting'}
      </h1>

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
          <button className="px-6 py-3 bg-gray-700 text-white rounded-lg" onClick={() => location.reload()}>
            Leave
          </button>
        )}
      </div>

      {/* Meeting SDK target */}
      {mode !== 'video' && (
        <div ref={meetingRootRef} id="zmmtg-root" className="w-[960px] h-[540px] bg-black rounded overflow-hidden" />
      )}

      {/* Video SDK canvas */}
      {mode === 'video' && (
        <canvas ref={videoCanvasRef} id="video-canvas" className="bg-black rounded" width={640} height={360} />
      )}

      <div className="mt-4 text-sm text-gray-600">
        <div><b>Mode:</b> {mode === 'video' ? 'Video SDK' : 'Meeting SDK (embedded)'}</div>
        <div><b>Meeting ID:</b> {String(meeting_id)}</div>
        <div><b>User:</b> {userName}</div>
        <div><b>Role:</b> {role === 1 ? 'Host' : 'Attendee'}</div>
      </div>
    </div>
  );
}