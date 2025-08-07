"use client";

import { Suspense } from 'react';
import { useAgendaStore } from '@/stores/useAgendaStore';
import Agenda from '@/components/Agenda';
import RequestsWrapper from '@/components/RequestsWrapper';
import Header from '@/components/Header';
import NudgeWrapper from '@/components/NudgeWrapper';
import BtnCancelSave from '@/components/BtnCancelSave';
import { useSearchParams } from 'next/navigation';

function HomeWrapper() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role') === 'host' ? 'participant' : 'host';
  return <HomeLayout role={role} />;
}

function HomeLayout({ role }: { role: 'host' | 'participant' }) {
  const { isEditingMode } = useAgendaStore();

  return (
    <aside
      className="fixed left-0 top-0 h-[100svh] max-h-[1000px] flex flex-col w-[clamp(250px,40vw,400px)]
                 bg-[var(--primary)] transition-width duration-100 ease-in-out space-y-2"
    >
      <div id="main" className="flex flex-col flex-grow justify-center space-y-2 min-h-0">

        <div id="header" className="flex-shrink-0 bg-[var(--secondary)] pb-4 rounded-b-xl shadow-md">
          <Header role={role} />
          <div id="nudge-wrapper" className="px-4 pt-4  justify-center gap-2">
            <NudgeWrapper />
          </div>
        </div>

        <div className="flex-1 min-h-0 relative overflow-hidden rounded-md">
          <div
            className="overflow-y-auto h-full rounded-lg px-4"
          >
            <div>
              <Suspense fallback={<div>Loading agenda…</div>}>
                <Agenda role={role} />
              </Suspense>
            </div>
          </div>

          <div
            className={`pointer-events-none absolute bottom-0 left-0 right-0 h-8`}
          />
        </div>

        <div className="flex-shrink-0 border-t border-gray-200">
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
