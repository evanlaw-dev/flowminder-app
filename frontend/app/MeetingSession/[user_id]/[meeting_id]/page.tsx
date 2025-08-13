// frontend/app/MeetingSession/[user_id]/[meeting_id]/page.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as ReactDOM from 'react-dom';
import { useParams, useSearchParams } from 'next/navigation';

// // Minimal type for the Zoom Embedded client to avoid `any`
// type ZoomEmbeddedClient = {
//   init: (opts: { zoomAppRoot: HTMLElement; language?: string; patchJsMedia?: boolean }) => Promise<void>;
//   join: (opts: {
//     signature: string;
//     meetingNumber: string;
//     password?: string;
//     userName: string;
//     userEmail?: string;
//     zak?: string;
//   }) => Promise<void>;
//   leave?: () => Promise<void> | void;
//   destroy?: () => Promise<void> | void;
// };

/**
 * Component View integration for Zoom Meeting SDK (embedded)
 * - Initializes the SDK in a dedicated container div
 * - Fetches a Meeting SDK signature (and ZAK for host role) from backend
 * - Joins as host (role=1) or attendee (role=0)
 */
export default function MeetingSessionPage() {
  const { user_id, meeting_id } = useParams<{ user_id: string; meeting_id: string }>();
  const searchParams = useSearchParams();

  // /MeetingSession/:user_id/:meeting_id?role=1&name=Alice&pwd=12345
  const role = Number(searchParams.get('role') || '0'); // 0 attendee, 1 host
  const userName = searchParams.get('name') || (role === 1 ? 'FlowMinder Host' : 'FlowMinder Participant');
  const password = searchParams.get('pwd') || ''; // empty string if only waiting room required

  const meetingNumber = String(meeting_id);
  const zoomUserId = String(user_id);

  // Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const clientRef = useRef<unknown>(null);

  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'initializing' | 'joining' | 'joined'>('idle');

  useEffect(() => {
    let mounted = true;

    // Ensure global React + ReactDOM for Zoom SDK internals
    const w = window as unknown as { React?: typeof React; ReactDOM?: typeof ReactDOM };
    if (!w.React) (w as { React: typeof React }).React = React;
    if (!w.ReactDOM) (w as { ReactDOM: typeof ReactDOM }).ReactDOM = ReactDOM;

    (async () => {
      try {
        const base = process.env.NEXT_PUBLIC_BACKEND_URL as string;
        if (!base) throw new Error('Missing NEXT_PUBLIC_BACKEND_URL');

        // Lazy import the embedded SDK and create client once
        const ZoomMtgEmbedded = (await import('@zoom/meetingsdk/embedded')).default;
        if (!clientRef.current) {
          clientRef.current = ZoomMtgEmbedded.createClient();
        }
        // const client = clientRef.current;
        const client = ZoomMtgEmbedded.createClient()

        const meetingSDKElement = containerRef.current;
        if (!meetingSDKElement) throw new Error('Missing meeting container');

        setStatus('initializing');
        await client.init({
          zoomAppRoot: meetingSDKElement,
          language: 'en-US',
          patchJsMedia: true,
        });

        // Get signature (and ZAK when hosting)
        const sigRes = await fetch(`${base}/zoom/sdk-signature`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetingNumber, role }),
        });
        if (!sigRes.ok) throw new Error(await sigRes.text());
        const { signature } = (await sigRes.json()) as { signature: string };

        let zak: string | undefined;
        if (role === 1) {
          const zakRes = await fetch(`${base}/zoom/zak?userId=${encodeURIComponent(zoomUserId)}`);
          if (!zakRes.ok) throw new Error(await zakRes.text());
          const z = await zakRes.json();
          zak = z?.zak;
        }

        setStatus('joining');
        await client.join({
          signature,
          meetingNumber,
          password,
          userName,
          userEmail: undefined, // add for webinars/registration if needed
          zak,
        });

        if (!mounted) return;
        setStatus('joined');
      } catch (e) {
        if (!mounted) return;
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        setStatus('idle');
        console.error('[MeetingSession] Failed to start Meeting SDK:', e);
      }
    })();

    return () => {
      mounted = false;
      // Clean up SDK instance on unmount
      try {
        const client = clientRef.current;
        if (!client) throw new Error('Zoom SDK client not created');
        // if (client) {
        //   // leave first to stop audio/video, then destroy
        //   client.leave?.();
        //   client.destroy?.();
        // }
      } catch {}
    };
  }, [meetingNumber, role, userName, password, zoomUserId]);

  return (
    <div className="w-screen h-screen">
      {/* Step 2: HTML Container */}
      <div
        id="meetingSDKElement"
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Minimal overlay for status/errors */}
      {(status !== 'joined' || error) && (
        <div className="pointer-events-none absolute inset-0 flex items-start justify-end p-3">
          <div className="pointer-events-auto bg-black/60 text-white text-sm rounded px-3 py-2 space-y-1">
            <div><span className="opacity-75">Status:</span> {status}</div>
            {error && <div className="text-red-300">{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
}