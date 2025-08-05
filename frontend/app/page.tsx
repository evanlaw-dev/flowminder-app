'use client'
import React from 'react';
import Agenda from '@/components/Agenda';
import RequestsWrapper from '@/components/RequestsWrapper';
import Header from '@/components/Header';
import Nudge from '@/components/Nudge';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useAgendaStore } from '@/stores/useAgendaStore';
import BtnCancelSave from '@/components/BtnCancelSave';

// Wrapper that reads role from URL and renders HomeLayout
function HomeWrapper() {
  const searchParams = useSearchParams();
  // Default role is 'participant' unless explicitly set to 'host'
  const role = searchParams.get('role') === 'host' ? 'host' : 'participant';
  return <Agenda role={role} />;
}

function ClientOnlyNudgeWrapper({ onNudgeSent }: { onNudgeSent: () => void }) {
  const searchParams = useSearchParams();
  const role = searchParams.get('role') === 'host' ? 'host' : 'participant';
  return <Nudge role={role} onNudgeSent={onNudgeSent} />;
}

function ClientOnlyRequestsWrapper({ refreshTrigger }: { refreshTrigger: number }) {
  const searchParams = useSearchParams();
  const role = searchParams.get('role') === 'host' ? 'host' : 'participant';
  return <RequestsWrapper refreshTrigger={refreshTrigger} role={role} />;
}

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const handleNudgeSent = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <main className="max-h-xl min-h-100 py-8 flex flex-col items-center w-full max-w-md gap-3 px-4 mx-auto">
      <Header />

      <Suspense fallback={null}>
        <ClientOnlyNudgeWrapper onNudgeSent={handleNudgeSent} />
      </Suspense>

      <Suspense fallback={<div>Loading agenda…</div>}>
        <ClientOnlyAgendaWrapper />
      </Suspense>

      <Suspense fallback={null}>
        <ClientOnlyRequestsWrapper refreshTrigger={refreshTrigger} />
      </Suspense>
    </main>
  );
}

export default function Home() {
  return <HomeWrapper />;
}
