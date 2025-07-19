'use client'
import Agenda from '@/components/Agenda';
import DisplayRequests from '@/components/DisplayRequests';
import CurrentAgendaItem from '@/components/CurrentAgendaItem';
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

export default function Home() {
  return (
    <main className="max-h-xl min-h-100 py-8 flex flex-col items-center w-full max-w-md gap-3 px-4 mx-auto">
      <CurrentAgendaItem />
      <Nudge />

      <Suspense fallback={<div>Loading agenda…</div>}>
        <ClientOnlyAgendaWrapper />
      </Suspense>

      <DisplayRequests />
    </main>
  );
}
