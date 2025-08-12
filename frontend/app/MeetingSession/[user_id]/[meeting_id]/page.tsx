// frontend/app/MeetingSession/[user_id]/[meeting_id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { ZoomMtg } from '@zoom/meetingsdk';

export default function MeetingSessionPage() {
  const { user_id: zoomUserId, meeting_id } = useParams(); // Get the Zoom user ID and meeting ID from the URL parameters
  const search = useSearchParams();
  const router = useRouter();

  const role = Number(search.get('role') || '0'); // 0 attendee, 1 host

  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(true);

  const base = process.env.NEXT_PUBLIC_BACKEND_URL as string; // your backend URL
  const sdkKey = process.env.NEXT_PUBLIC_ZOOM_SDK_KEY as string; // your Client ID

  useEffect(() => {
    (async () => {
      try {
        if (!base) throw new Error('Missing NEXT_PUBLIC_BACKEND_URL');
        if (!sdkKey) throw new Error('Missing NEXT_PUBLIC_ZOOM_SDK_KEY (Client ID)');

        // Prepare the Client View SDK
        ZoomMtg.preLoadWasm();
        ZoomMtg.prepareWebSDK();

        const meetingNumber = String(meeting_id);

        // 1) Get server-side signature (uses Client ID/Secret)
        const sigRes = await fetch(`${base}/zoom/sdk-signature`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetingNumber, role }),
        });
        if (!sigRes.ok) throw new Error(await sigRes.text());
        const { signature } = (await sigRes.json()) as { signature: string };

        // 2) Host needs ZAK
        let zak: string | undefined; // ZAK is only needed for hosts
        if (role === 1) {
          const zakRes = await fetch(`${base}/zoom/zak?userId=${zoomUserId}`);
          if (!zakRes.ok) throw new Error(await zakRes.text()); // Fetch ZAK from backend
          const j = (await zakRes.json()) as { zak?: string };
          zak = j.zak;
          if (!zak) throw new Error('Failed to get host ZAK');
        }

        // 3) Init + join (Client View renders its own full-page UI)
        await new Promise<void>((resolve, reject) => {
          ZoomMtg.init({
            leaveUrl: window.location.origin,
            success: () => resolve(),
            error: (err: unknown) => reject(err),
          });
        });

        await new Promise<void>((resolve, reject) => {
          ZoomMtg.join({ // Join the meeting with the Client View SDK
            sdkKey,
            signature,
            meetingNumber,
            passWord: '',
            userName: role === 1 ? 'Host (FlowMinder)' : 'Guest (FlowMinder)',
            zak,
            success: () => resolve(),
            error: (err: unknown) => reject(err),
          });
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
      {/* Client View injects its own DOM (zmmtg-root). Optionally include CSS links for styles. */}
      <link rel="stylesheet" href="https://source.zoom.us/3.11.2/css/bootstrap.css" />
      <link rel="stylesheet" href="https://source.zoom.us/3.11.2/css/react-select.css" />

      <div className="mb-3">
        <button onClick={() => router.back()} className="px-4 py-2 rounded bg-gray-600 text-white">Back</button>
      </div>
      {error && <div className="mb-3 text-red-600">{error}</div>}
      {joining && !error && <div className="mb-3">Joining meeting…</div>}
    </div>
  );
}