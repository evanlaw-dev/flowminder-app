"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAgendaStore } from "@/stores/useAgendaStore";
import Agenda from "@/components/Agenda";
import RequestsWrapper from "@/components/RequestsWrapper";
import Header from "@/components/Header";
import BtnCancelSave from "@/components/BtnCancelSave";

// Suspense wrapper component (to deal with next.js typecheck)
export default function Home() {
  return (
    <Suspense fallback={<div className="p-4">Loading…</div>}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") === "host" ? "participant" : "host";
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const handleNudgeSent = () => setRefreshTrigger((prev) => prev + 1);
  const { isEditingMode } = useAgendaStore();

  return (
    <aside
      className="fixed left-0 top-0 h-[100svh] max-h-[1000px] flex flex-col w-[clamp(250px,40vw,400px)]
                 bg-[var(--primary)] transition-width duration-100 ease-in-out space-y-2"
    >
      <div id="main" className="flex flex-col flex-grow justify-center space-y-2 min-h-0">
        <div id="header" className="flex-shrink-0 bg-[var(--secondary)] pb-2 rounded-b-xl shadow-md">
          <Header role={role} handleNudge={handleNudgeSent} />
        </div>

        <div className="flex-1 min-h-0 relative overflow-hidden rounded-md">
          <div className="overflow-y-auto h-full rounded-lg px-4">
            <div>
              <Suspense fallback={<div className="py-4">Loading agenda…</div>}>
                <Agenda role={role} />
              </Suspense>
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8" />
        </div>

        <div className="flex-shrink-0 justify-center border-t border-gray-200">
          {isEditingMode && <BtnCancelSave />}
          <Suspense fallback={<div className="px-4 py-3">Loading requests…</div>}>
            <RequestsWrapper refreshTrigger={refreshTrigger} />
          </Suspense>
        </div>
      </div>
    </aside>
  );
}
