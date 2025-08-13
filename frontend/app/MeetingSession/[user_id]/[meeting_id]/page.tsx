'use client';
import '@zoom/meetingsdk/dist/css/bootstrap.css';
import '@zoom/meetingsdk/dist/css/react-select.css';
import { useParams, useSearchParams } from 'next/navigation';
import { ZoomMtg } from '@zoom/meetingsdk';

ZoomMtg.preLoadWasm();
ZoomMtg.prepareWebSDK();

export default function MeetingSessionPage() {
  const { meeting_id } = useParams();
  const searchParams = useSearchParams();

  const meetingNumber = String(meeting_id);
  const userName = searchParams.get('name') || 'FlowMinder User';
  const passWord = searchParams.get('pwd') || '';
  const role = Number(searchParams.get('role') || '0'); // 0 attendee, 1 host
  const leaveUrl = process.env.NEXT_PUBLIC_LEAVE_URL || 'http://localhost:3000';

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
    document.getElementById('zmmtg-root')!.style.display = 'block';

    ZoomMtg.init({
      leaveUrl,
      patchJsMedia: true,
      success: () => {
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