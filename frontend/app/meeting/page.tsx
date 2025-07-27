'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Meeting() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [zoomUserId, setZoomUserId] = useState('');

  useEffect(() => {
    const userIdParam = searchParams.get('user_id');
    if (userIdParam) {
      setZoomUserId(userIdParam);
    }
  }, [searchParams]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Welcome to FlowMinder</h1>
      <p className="mb-6">Zoom User ID: {zoomUserId}</p>
      <div className="flex space-x-4">
        <button
          className="px-6 py-3 bg-green-600 text-white rounded-lg"
          onClick={() => router.push(`/schedule?user_id=${zoomUserId}`)}
        >
          Schedule New Meeting
        </button>
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-lg"
          onClick={() => router.push(`/join?user_id=${zoomUserId}`)}
        >
          Join Existing Meeting
        </button>
      </div>
    </div>
  );
}