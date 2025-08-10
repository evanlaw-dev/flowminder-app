// frontend/app/MeetingSession/[user_id]/[meeting_id]/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';

// Type helpers for the Zoom Embedded SDK (non-React module)
type ZoomEmbeddedModule = typeof import('@zoom/meetingsdk/embedded');

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

export default function InProgressPage() {
  const { user_id: zoomUserId, meeting_id } = useParams(); // param name matches folder: [meeting_id]
  const search = useSearchParams();
  const router = useRouter();
  const role = Number(search.get('role') || '0'); // 0 attendee, 1 host

  const containerRef = useRef<HTMLDivElement | null>(null);
  const clientRef = useRef<ZoomClient | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(true);
  const [zoomMod, setZoomMod] = useState<ZoomEmbeddedModule | null>(null);

  const base = process.env.NEXT_PUBLIC_BACKEND_URL as string;
  const sdkKey = process.env.NEXT_PUBLIC_ZOOM_SDK_KEY as string; // Client ID on the client

  // Load the non-React Zoom module on the client
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import('@zoom/meetingsdk/embedded');
        if (mounted) setZoomMod(mod);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        setJoining(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Initialize and join when ready
  useEffect(() => {
    (async () => {
      try {
        if (!base) throw new Error('Missing NEXT_PUBLIC_BACKEND_URL');
        if (!sdkKey) throw new Error('Missing NEXT_PUBLIC_ZOOM_SDK_KEY (Client ID)');
        if (!zoomMod) return; // wait for module to load
        if (!containerRef.current) throw new Error('Container missing');

        // Create the client once
        if (!clientRef.current) {
          // createClient exists on the module — cast to our minimal interface
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const created = (zoomMod as any).createClient?.();
          if (!created) throw new Error('Zoom SDK not ready');
          clientRef.current = created as ZoomClient;
        }
        const client = clientRef.current;

        const meetingNumber = String(meeting_id);

        // 1) Get server-side signature (uses Client ID/Secret)
        const sigRes = await fetch(`${base}/zoom/sdk-signature`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetingNumber, role }),
        });
        if (!sigRes.ok) throw new Error(await sigRes.text());
        const { signature } = await sigRes.json();

        // 2) Host needs ZAK
        let zak: string | undefined;
        if (role === 1) {
          const zakRes = await fetch(`${base}/zoom/zak?userId=${zoomUserId}`);
          if (!zakRes.ok) throw new Error(await zakRes.text());
          const j = await zakRes.json();
          zak = j?.zak;
          if (!zak) throw new Error('Failed to get host ZAK');
        }

        // 3) Init + join
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
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      } finally {
        setJoining(false);
      }
    })();
  }, [base, sdkKey, zoomMod, meeting_id, role, zoomUserId]);

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