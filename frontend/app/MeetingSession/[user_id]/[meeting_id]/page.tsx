// frontend/app/MeetingSession/[user_id]/[meeting_id]/page.tsx
'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { ZoomMtg } from '@zoom/meetingsdk';

// --- Minimal Meeting SDK setup (v4) ---
// Point SDK to CDN and prepare assets once at module load
ZoomMtg.setZoomJSLib('https://source.zoom.us/4.0.0/lib', '/av');
ZoomMtg.preLoadWasm();
ZoomMtg.prepareWebSDK();

export default function MeetingSessionPage() {
  const { user_id, meeting_id } = useParams<{ user_id: string; meeting_id: string }>();
  const searchParams = useSearchParams();

  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
  const sdkKey = process.env.NEXT_PUBLIC_ZOOM_SDK_KEY || '';

  const meetingNumber = String(meeting_id);
  const role = Number(searchParams.get('role') || '0'); // 0 attendee, 1 host
  const userName = searchParams.get('name') || 'FlowMinder User';
  const passWord = searchParams.get('pwd') || '';

  // const containerRef = useRef<HTMLDivElement | null>(null);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  const leaveUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/meeting/${String(user_id)}`
    : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const getSignature = useCallback(async (): Promise<string> => {
    const res = await fetch(`${backend}/zoom/sdk-signature`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingNumber, role }),
    });
    const body = await res.json();
    if (!res.ok || !body?.signature) throw new Error('Could not get Meeting SDK signature');
    return body.signature as string;
  }, [backend, meetingNumber, role]);

  const getZakIfHost = useCallback(async (): Promise<string | undefined> => {
    if (role !== 1) return undefined;
    const res = await fetch(`${backend}/zoom/zak?userId=${encodeURIComponent(String(user_id))}`);
    const body = await res.json();
    if (!res.ok || !body?.zak) throw new Error('Host ZAK not available. Please re-auth via Zoom OAuth.');
    return body.zak as string;
  }, [backend, role, user_id]);

  const startMeeting = useCallback(async () => {
    try {
      setJoining(true);

      // Ensure the root exists/shown
      let root = document.getElementById('zmmtg-root');
      if (!root) {
        root = document.createElement('div');
        root.id = 'zmmtg-root';
        document.body.appendChild(root);
      }
      root.style.display = 'block';

      const [signature, zak] = await Promise.all([
        getSignature(),
        getZakIfHost(),
      ]);

      // v4 breaking change: load i18n before init/join
      await ZoomMtg.i18n.load('en-US');

      await new Promise<void>((resolve, reject) => {
        ZoomMtg.init({
          leaveUrl,
          patchJsMedia: true,
          leaveOnPageUnload: true,
          success: () => resolve(),
          error: (err: unknown) => reject(err),
        });
      });

      await new Promise<void>((resolve, reject) => {
        ZoomMtg.join({
          signature,
          sdkKey, // optional in some 4.x builds but safe to include
          meetingNumber,
          userName,
          passWord,
          zak, // only needed for host
          success: () => {
            setJoined(true);
            resolve();
          },
          error: (err: unknown) => reject(err),
        });
      });
    } catch (e) {
      console.error('Join failed:', e);
      alert('Failed to start meeting. Check OAuth/ZAK and signature.');
    } finally {
      setJoining(false);
    }
  }, [getSignature, getZakIfHost, leaveUrl, meetingNumber, passWord, sdkKey, userName]);

  // Optional: auto-join if you want
  // useEffect(() => { startMeeting(); }, [startMeeting]);

  return (
    <div className="p-6">
      <h1 className="text-xl mb-4">Zoom Meeting SDK (Embedded)</h1>
      <div className="mb-4 flex gap-2">
        <button
          onClick={startMeeting}
          disabled={joining || joined}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {joining ? 'Joining…' : joined ? 'Joined' : (role === 1 ? 'Start as Host' : 'Join as Participant')}
        </button>
      </div>

    </div>
  );
}