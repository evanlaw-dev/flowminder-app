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
    <aside
      className="fixed left-0 top-0 h-[100svh] max-h-[1000px] flex flex-col w-[clamp(0px,40vw,400px)] px-4
                 bg-white transition-width duration-200 ease-in-out py-4 space-y-2"
    >

        <div className="flex flex-col flex-grow justify-center space-y-2 min-h-0">
      {/* Top fixed area */}
      <div className="flex-shrink-0">
        <Header role={role} />
      </div>

      <div className="flex-shrink-0">
        <Nudge />
      </div>

      {/* Scrollable agenda area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="flex flex-col justify-center min-h-full">
              <Suspense fallback={<div>Loading agenda…</div>}>
                <Agenda role={role} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom container */}
      <div className="flex-shrink-0 bg-white px-3 py-2">
        {isEditingMode && <BtnCancelSave />}
        <RequestsWrapper />
      </div>
      </div>
    </aside>
  );
}

export default function Home() {
  return <HomeWrapper />;
}