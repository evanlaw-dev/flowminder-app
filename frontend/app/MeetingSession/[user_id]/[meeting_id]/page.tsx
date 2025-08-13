'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { ZoomMtg } from '@zoom/meetingsdk';
import { useEffect } from 'react';

ZoomMtg.preLoadWasm();
ZoomMtg.prepareWebSDK();

const ensureZoomCss = () => {
  const id = 'zoom-meeting-sdk-css';
  if (typeof document === 'undefined') return;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  // Match your SDK logs (4.0.0):
  link.href = 'https://source.zoom.us/4.0.0/css/zoom-meeting-4.0.0.min.css';
  document.head.appendChild(link);
};
export default function MeetingSessionPage() {
  const { user_id, meeting_id } = useParams();
  const searchParams = useSearchParams();

  useEffect(() => {
    ensureZoomCss();
  }, []);

  const meetingNumber = String(meeting_id);
  const userName = searchParams.get('name') || 'FlowMinder User';
  const passWord = searchParams.get('pwd') || '';
  const role = Number(searchParams.get('role') || '0'); // 0 attendee, 1 host
  const leaveUrl = (typeof window !== 'undefined'
    ? `${window.location.origin}/meeting/${String(user_id)}`
    : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');

  const getSignature = async (): Promise<void> => {
    try {
      const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      const response: Response = await fetch(`${base}/zoom/sdk-signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingNumber, role }),
      });
      const data = await response.json();
      const signature = data.signature as string;
      startMeeting(signature);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Signature error:', err.message);
      } else {
        console.error('Signature error:', err);
      }
    }
  };

  const startMeeting = (signature: string) => {
    let root = document.getElementById('zmmtg-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'zmmtg-root';
      document.body.appendChild(root);
    }
    root.style.display = 'block';

    ZoomMtg.init({
      leaveUrl,
      patchJsMedia: true,
      success: () => {
        console.log('ZoomMtg.init success, joining…');
        ZoomMtg.join({
          signature,
          sdkKey: process.env.NEXT_PUBLIC_ZOOM_SDK_KEY || '',
          meetingNumber,
          passWord,
          userName,
          success: (res: unknown) => console.log('Join success', res),
          error: (err: unknown) => console.error('Join error', err),
        });
      },
      error: (err: unknown) => {
        console.error('Init error', err);
      },
    });
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