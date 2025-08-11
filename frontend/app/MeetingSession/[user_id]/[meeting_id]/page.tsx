// frontend/app/MeetingSession/[user_id]/[meeting_id]/page.tsx
'use client';

import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import ZoomMtgEmbedded from '@zoom/meetingsdk/embedded';

declare global {
  interface Window {
    React?: typeof import('react');
  }
}

interface ZoomClient {
  init(opts: {
    zoomAppRoot: HTMLDivElement;
    language?: string;
    customize?: Record<string, unknown>;
  }): Promise<void>;
  join(opts: {
    sdkKey: string;
    signature: string;
    meetingNumber: string;
    password?: string;
    userName: string;
    zak?: string;
  }): Promise<void>;
}

export default function MeetingSessionPage() {
  const { user_id: zoomUserId, meeting_id } = useParams();
  const search = useSearchParams();
  const router = useRouter();

  const role = Number(search.get('role') || '0'); // 0 attendee, 1 host

  const containerRef = useRef<HTMLDivElement | null>(null);
  const clientRef = useRef<ZoomClient | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(true);

  const base = process.env.NEXT_PUBLIC_BACKEND_URL as string;
  const sdkKey = process.env.NEXT_PUBLIC_ZOOM_SDK_KEY as string; // your Client ID

  // Some SDKs expect a global React. Expose it (harmless if already present).
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.React) {
      window.React = React;
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (!base) throw new Error('Missing NEXT_PUBLIC_BACKEND_URL');
        if (!sdkKey) throw new Error('Missing NEXT_PUBLIC_ZOOM_SDK_KEY (Client ID)');
        if (!containerRef.current) throw new Error('Container missing');

        // Create client once
        if (!clientRef.current) {
          const created = (ZoomMtgEmbedded as unknown as { createClient: () => ZoomClient }).createClient();
          clientRef.current = created;
        }
        const client = clientRef.current as ZoomClient;

        const meetingNumber = String(meeting_id);

        // Get Meeting SDK signature from backend (uses your Client ID/Secret)
        const sigRes = await fetch(`${base}/zoom/sdk-signature`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetingNumber, role }),
        });
        if (!sigRes.ok) throw new Error(await sigRes.text());
        const { signature } = (await sigRes.json()) as { signature: string };

        // If hosting, fetch ZAK
        let zak: string | undefined;
        if (role === 1) {
          const zakRes = await fetch(`${base}/zoom/zak?userId=${zoomUserId}`);
          if (!zakRes.ok) throw new Error(await zakRes.text());
          const j = (await zakRes.json()) as { zak?: string };
          zak = j.zak;
          if (!zak) throw new Error('Failed to get host ZAK');
        }

        // Init + join
        await client.init({
          zoomAppRoot: containerRef.current,
          language: 'en-US',
          customize: { video: { isResizable: true }, toolbar: { buttons: [] } },
        });

        await client.join({
          sdkKey,
          signature,
          meetingNumber,
          password: '',
          userName: role === 1 ? 'Host (FlowMinder)' : 'Guest (FlowMinder)',
          zak,
        });
      } catch (e: unknown) {
        console.error('MeetingSession error:', e);
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      } finally {
        setJoining(false);
      }
    })();
  }, [base, sdkKey, meeting_id, role, zoomUserId]);

  return (
    <div className="min-h-screen p-4">
      <div className="mb-3">
        <button onClick={() => router.back()} className="px-4 py-2 rounded bg-gray-600 text-white">Back</button>
      </div>
      {error && <div className="mb-3 text-red-600">{error}</div>}
      {joining && !error && <div className="mb-3">Joining meeting…</div>}
      <div ref={containerRef} className="w-full h-[80vh] bg-black/5 rounded" />
    </div>
  );
}