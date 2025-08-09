'use client'
import React from 'react';
import Agenda from '@/components/Agenda';
import RequestsWrapper from '@/components/RequestsWrapper';
import Header from '@/components/Header';
import Nudge from '@/components/Nudge';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ClientOnlyAgendaWrapper() {
  const searchParams = useSearchParams();

  // TODO change default role to 'participant'. currently set to 'host' for testing purposes
  const role = searchParams.get('role') === 'participant' ? 'participant' : 'host';
  // default is participant on this line
  // const role = searchParams.get('role') === 'host' ? 'host' : 'participant'; 
  return <Agenda role={role} />;
}

function ClientOnlyNudgeWrapper({ onNudgeSent }: { onNudgeSent: () => void }) {
  const searchParams = useSearchParams();
  const role = searchParams.get('role') === 'participant' ? 'participant' : 'host';
  
  return <Nudge role={role} onNudgeSent={onNudgeSent} />;
}

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  
  const handleNudgeSent = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  return (
    <main className="max-h-xl min-h-100 py-8 flex flex-col items-center w-full max-w-md gap-3 px-4 mx-auto">
      <Header />
      <ClientOnlyNudgeWrapper onNudgeSent={handleNudgeSent} />

      <Suspense fallback={<div>Loading agenda…</div>}>
        <ClientOnlyAgendaWrapper />
      </Suspense>

      <RequestsWrapper refreshTrigger={refreshTrigger} />
    </main>
  );
}
