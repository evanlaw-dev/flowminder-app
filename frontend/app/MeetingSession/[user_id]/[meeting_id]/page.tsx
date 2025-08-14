// frontend/app/MeetingSession/[user_id]/[meeting_id]/page.tsx
// frontend/app/MeetingSession/[user_id]/[meeting_id]/page.tsx
'use client';


import { useParams, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import ZoomVideo from '@zoom/videosdk';

// Zoom Meeting SDK types
interface ZoomMtgType {
  setZoomJSLib: (path: string, subdir: string) => void;
  preLoadWasm?: () => void;
  // prepareJssdk?: () => void;
  prepareWebSDK?: () => void; // v4 name
  i18n?: {
    load?: (lang: string) => void;
    reload?: (lang: string) => void;
  };
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

type MeetingSDKModule = { ZoomMtg: ZoomMtgType };

// global window react for Zoom SDK
declare global {
  interface Window {
    React?: unknown;
    ReactDOM?: unknown;
  }
}

// Helper to inject Zoom Meeting SDK CSS from CDN if not already present
const ensureZoomCss = (version: string = '4.0.0'): void => {
  const head = document.head;
  const urls = [
    `https://source.zoom.us/${version}/css/bootstrap.css`,
    `https://source.zoom.us/${version}/css/react-virtualized.css`,
  ];
  urls.forEach((href) => {
    const exists = Array.from(head.querySelectorAll('link[rel="stylesheet"]')).some(l => (l as HTMLLinkElement).href === href);
    if (!exists) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.crossOrigin = 'anonymous'; // Ensure CORS for CDN
      head.appendChild(link);
    }
  });
};

/**
 * Embed Zoom Meeting (Meeting SDK) using OAuth + ZAK for host
 * - Default: Meeting SDK (embedded Zoom UI)
 * - Alt: add `?use=video` to use Video SDK (for ad‑hoc tests)
 */

// session page component
export default function SessionPage() {
  const { meeting_id, user_id } = useParams<{ meeting_id: string; user_id: string }>();
  const searchParams = useSearchParams();

  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  // Get user name and role from search params
  const userName = searchParams.get('name') || 'FlowMinder User';
  const role = Number(searchParams.get('role') || '1'); // 1 = host, 0 = attendee
  const mode = (searchParams.get('use') || 'meeting').toLowerCase(); // 'meeting' | 'video'

  // Backend URL and Zoom SDK key from env
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
  const sdkKey = process.env.NEXT_PUBLIC_ZOOM_SDK_KEY as string;

  // Refs for DOM elements
  const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const meetingRootRef = useRef<HTMLDivElement | null>(null);

  // Helper: load vendor React/ReactDOM globals if the SDK expects them
  // const loadVendorIfNeeded = async (): Promise<void> => {
  //   if (window.React && window.ReactDOM) return;
  //   // Zoom SDK requires React and ReactDOM in global scope
  //   const add = (src: string): Promise<void> =>
  //     new Promise((resolve, reject) => {
  //       const s = document.createElement('script');
  //       s.src = src;
  //       s.async = false; // preserve order
  //       s.onload = () => resolve();
  //       s.onerror = () => reject(new Error(`Failed to load ${src}`));
  //       document.head.appendChild(s);
  //     });

  //   // Load from the same CDN version as setZoomJSLib
  //   await add('https://source.zoom.us/4.0.0/lib/vendor/react.min.js');
  //   await add('https://source.zoom.us/4.0.0/lib/vendor/react-dom.min.js');
  // };

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

      // 3) Load Meeting SDK and embed
      const mod = (await import('@zoom/meetingsdk')) as MeetingSDKModule;
      // await loadVendorIfNeeded();
      ensureZoomCss('4.0.0');
      const ZoomMtg = mod.ZoomMtg;

      ZoomMtg.setZoomJSLib('https://source.zoom.us/4.0.0/lib', '/av');
      ZoomMtg.preLoadWasm?.();
      // Prefer the newer prep on v4, fallback for older builds
      ZoomMtg.prepareWebSDK?.();
      // ZoomMtg.prepareJssdk?.();
      // Optional i18n (safe no-op if not present)
      ZoomMtg.i18n?.load?.('en-US');
      ZoomMtg.i18n?.reload?.('en-US');

      // 4) Init and join
      await new Promise<void>((resolve, reject) => {
        ZoomMtg.init({
          leaveUrl: window.location.origin,
          isSupportAV: true,
          disableRecord: true,
          meetingSDKElement: meetingRootRef.current!,
          success: resolve,
          error: (err: unknown) => reject(err),
        });
      });

      // Join the meeting
      await new Promise<void>((resolve, reject) => {
        ZoomMtg.join({
          signature,
          sdkKey,
          meetingNumber,
          userName,
          passWord: '',
          zak,
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
    // For attendees, we use the meeting_id as the session name (must match a host-created session)
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

  return (
    <div className="p-6">
      <h1 className="text-xl mb-2">
        {mode === 'video' ? 'Zoom Video SDK — Session' : 'Zoom Meeting SDK — Embedded Meeting'}
      </h1>

      {/* Buttons to start the session */}
      {/* <div className="mb-3 flex gap-2">
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
      </div> */}

      {/* Show join button only if not joined or joining */}
      {!joined && !joining && (
        <button
          onClick={mode === 'video' ? startVideoSdk : startMeetingSdk}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg"
        >
          Join meeting
        </button>
      )}

      <div
        ref={meetingRootRef}
        id="zoom-meeting-root"
        style={{ width: '100%', height: '75vh' }}
      />

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