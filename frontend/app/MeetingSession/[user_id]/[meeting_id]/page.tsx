'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { ZoomMtg } from '@zoom/meetingsdk';

// 1) Point the SDK to the correct asset path for 4.0.0 (before preLoadWasm/prepareWebSDK)
ZoomMtg.setZoomJSLib('https://source.zoom.us/4.0.0/lib', '/av');

// 2) Then load/prepare
ZoomMtg.preLoadWasm();
ZoomMtg.prepareWebSDK();

export default function MeetingSessionPage() {
  const { user_id, meeting_id } = useParams();
  const searchParams = useSearchParams();

  const meetingNumber = String(meeting_id);
  const userName = searchParams.get('name') || 'FlowMinder User';
  const passWord = searchParams.get('pwd') || '';
  const role = Number(searchParams.get('role') || '0'); // 0 attendee, 1 host
  const leaveUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/meeting/${String(user_id)}`
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const getSignature = async (): Promise<void> => {
    try {
      const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      const response = await fetch(`${base}/zoom/sdk-signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingNumber, role }),
      });
      const { signature } = await response.json();
      startMeeting(signature as string);
    } catch (err) {
      console.error('Signature error:', err);
    }
  };

  const startMeeting = (signature: string) => {
    // Ensure the Zoom root exists
    let root = document.getElementById('zmmtg-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'zmmtg-root';
      document.body.appendChild(root);
    }
    root.style.display = 'block';

    // 3) 4.0.0 breaking change: load i18n first, then init + join
    ZoomMtg.i18n
      .load('en-US')
      .then(() => {
        interface ZoomInitOptions {
          leaveUrl: string;
          patchJsMedia: boolean;
          success: () => void;
          error: (err: unknown) => void;
        }

        interface ZoomJoinOptions {
          signature: string;
          meetingNumber: string;
          passWord: string;
          userName: string;
          success: (res: unknown) => void;
          error: (err: unknown) => void;
        }

        ZoomMtg.init({
          leaveUrl,
          patchJsMedia: true,
          success: () => {
            console.log('ZoomMtg.init success, joining…');

            ZoomMtg.join({
              signature,
              meetingNumber,
              passWord,
              userName,
              success: (res: unknown) => console.log('Join success', res),
              error: (err: unknown) => console.error('Join error', err),
            } as ZoomJoinOptions);
          },
          error: (err: unknown) => console.error('Init error', err),
        } as ZoomInitOptions);
      })
      .catch((e) => console.error('i18n load error', e));
  };

  return (
    <div className="p-6">
      <h1 className="text-xl mb-4">Join Zoom Meeting</h1>
      <button
        onClick={getSignature}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg"
      >
        Join Meeting
      </button>
      <div id="zmmtg-root"></div>
    </div>
  );
}