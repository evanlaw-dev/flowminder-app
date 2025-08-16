// frontend/app/MeetingSession2/[user_id]/[meeting_id]/page.tsx
'use client';

import { useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ZoomMtg } from '@zoomus/websdk';

// Preload WebAssembly + prepare SDK
ZoomMtg.setZoomJSLib('https://source.zoom.us/3.14.0/lib', '/av'); // pick your version
ZoomMtg.preLoadWasm();
ZoomMtg.prepareWebSDK();

interface ZoomError {
  method: string;
  status: boolean;
  errorCode: number;
  errorMessage: string;
  result: string;
}

export default function SessionPage() {
  const { meeting_id } = useParams<{ meeting_id: string }>();
  const searchParams = useSearchParams();

  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  const userName = searchParams.get('name') || 'FlowMinder User';
  const role = Number(searchParams.get('role') || '0'); // 0 = attendee, 1 = host
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
  const sdkKey = process.env.NEXT_PUBLIC_ZOOM_SDK_KEY as string;

  const meetingRootRef = useRef<HTMLDivElement | null>(null);

  const joinMeeting = async () => {
    try {
      setJoining(true);

      // 1. Get signature from backend
      const sigRes = await fetch(`${backend}/zoom/sdk-signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingNumber: meeting_id, role }),
      });
      const { signature } = await sigRes.json();
      if (!signature) throw new Error('No signature returned');

      // 2. Init Zoom SDK
      ZoomMtg.init({
        leaveUrl: window.location.origin,
        isSupportAV: true,
        success: () => {
          // 3. Join meeting
          ZoomMtg.join({
            signature,
            sdkKey,
            meetingNumber: String(meeting_id),
            userName,
            passWord: '', // add meeting passcode if required
            success: () => {
              setJoined(true);
              console.log('Joined meeting');
            },
            error: (err: ZoomError) => {
              console.error('Join error', err);
            },
          });
        },
        error: (err: ZoomError) => {
          console.error('Init error', err);
        },
      });
    } catch (err) {
      console.error('Join failed', err);
      alert('Could not join meeting');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl mb-4">Zoom Meeting SDK — Basic Embed</h1>

      {!joined ? (
        <button
          onClick={joinMeeting}
          disabled={joining}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg"
        >
          {joining ? 'Joining…' : 'Join Meeting'}
        </button>
      ) : (
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gray-700 text-white rounded-lg"
        >
          Leave
        </button>
      )}

      {/* Meeting renders automatically inside Zoom’s injected container */}
      <div ref={meetingRootRef} id="zmmtg-root" className="w-[960px] h-[540px] mt-6 bg-black" />
    </div>
  );
}