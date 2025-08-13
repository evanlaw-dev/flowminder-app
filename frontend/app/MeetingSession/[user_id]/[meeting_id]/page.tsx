'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { ZoomMtg } from '@zoom/meetingsdk';

// preload + prepare
ZoomMtg.preLoadWasm();
ZoomMtg.prepareWebSDK();

// Meeting session page component
export default function MeetingSessionPage() {
  const { user_id, meeting_id } = useParams();
  const searchParams = useSearchParams();

  // redirect to home if missing user_id or meeting_id
  const authEndpoint =
    (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000') + '/zoom/sdk-signature';
  const sdkKey = process.env.NEXT_PUBLIC_ZOOM_SDK_KEY || '';

  // Required params
  const meetingNumber = String(meeting_id);
  const passWord = searchParams.get('pwd') || '';
  const role = Number(searchParams.get('role') || '0');
  const userName = searchParams.get('name') || 'FlowMinder User';
  const userEmail = searchParams.get('email') || '';
  const registrantToken = searchParams.get('tk') || '';
  const zakToken = searchParams.get('zak') || '';

  // Leave URL - redirect back to home page if user leaves the meeting
  const leaveUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/meeting/${String(user_id)}`
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Fetch signature from backend and start the meeting
  const getSignature = async (): Promise<void> => {
    try {
      const req = await fetch(authEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingNumber, role }),
      });
      const res = await req.json();
      const signature = (res as { signature: string }).signature;
      startMeeting(signature);
    } catch (e) {
      console.log(e);
    }
  };

  // Initialize and join the Zoom meeting
  function startMeeting(signature: string) {
    // Ensure the SDK root exists like the sample expects
    let root = document.getElementById('zmmtg-root');

    // Create if missing
    if (!root) {
      root = document.createElement('div');
      root.id = 'zmmtg-root';
      document.body.appendChild(root);
    }
    root.style.display = 'block';

    // Now init and join
    ZoomMtg.init({
      leaveUrl: leaveUrl,
      patchJsMedia: true,
      leaveOnPageUnload: true,
      success: (success: unknown) => {
        console.log(success);
        ZoomMtg.join({
          signature: signature,
          sdkKey: sdkKey,
          meetingNumber: meetingNumber,
          passWord: passWord,
          userName: userName,
          userEmail: userEmail,
          tk: registrantToken,
          zak: zakToken,
          success: (success: unknown) => {
            console.log(success);
          },
          error: (error: unknown) => {
            console.log(error);
          },
        });
      },
      error: (error: unknown) => {
        console.log(error);
      },
    });
  }

  return (
    <div className="p-6">
      <h1 className="text-xl mb-4">Zoom Meeting SDK Sample React (Next.js)</h1>
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