// meeting/[user_id]/page.tsx
'use client';

import { useRouter } from 'next/navigation';

export default function MeetingPage({
  params,
}: {
  params: { user_id: string };
}) {
  const router = useRouter();
  const zoomUserId = params.user_id;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Welcome to FlowMinder</h1>
      <p className="mb-6">Zoom User ID: {zoomUserId}</p>
      <div className="flex space-x-4">
        <button
          className="px-6 py-3 bg-green-600 text-white rounded-lg"
          onClick={() => router.push(`/schedule/${zoomUserId}`)}
        >
          Schedule New Meeting
        </button>
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-lg"
          onClick={() => router.push(`/join/${zoomUserId}`)}
        >
          Join Existing Meeting
        </button>
      </div>
    </div>
  );
}