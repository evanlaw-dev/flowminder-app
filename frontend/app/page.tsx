'use client'

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

  // Determine role from search params (default to host)
  const role = searchParams.get('role') === 'host' ? 'participant' : 'host';

  return <HomeLayout role={role} />;
}

// Pure layout component that receives role prop
function HomeLayout({ role }: { role: 'host' | 'participant' }) {
  const { isEditingMode } = useAgendaStore();
  return (
    <aside className="fixed left-0 top-0 h-[100svh] max-h-[1000px] flex flex-col justify-center 
               w-[clamp(0px,40vw,400px)] px-4 items-center overflow-hidden  
               transition-width duration-200 ease-in-out bg-white">        
      <div className="flex flex-col max-h-full w-full gap-2 justify-center">
        <Header role={role} />
        <Nudge />
        <Suspense fallback={<div>Loading agenda…</div>}>
          <Agenda role={role} />
        </Suspense>
        {isEditingMode && <BtnCancelSave />}
        <RequestsWrapper />
      </div>
    </aside>
  );
}

export default function Home() {
  return <HomeWrapper />;
}
