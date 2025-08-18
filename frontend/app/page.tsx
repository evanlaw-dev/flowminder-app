// frontend/app/page.tsx
"use client";

import React, { Suspense, useEffect, useRef } from "react";
import { useAgendaStore } from "@/stores/useAgendaStore";
import { useMeetingStore } from "@/stores/useMeetingStore";
import { loadMeetingTimerSettings } from "@/services/agendaService";
import { initMeetingInfo } from "@/services/meetingService";
import { initAgendaSockets } from "@/sockets/agenda";
import { initSettingsSockets } from "@/sockets/settings";
import { socket } from "../sockets/socket";

import Agenda from "@/components/Agenda";
import Settings from "@/components/Settings";
import Header from "@/components/Header";
import BtnCancelSave from "@/components/BtnCancelSave";
import NudgeStatsPanel from "@/components/NudgeStatsPanel";

export default function Home() {
  return (
    <Suspense fallback={<div className="p-4">Loading…</div>}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const [clientMounted, setClientMounted] = React.useState(false);
  const { isEditingMode, showSettings } = useAgendaStore();

  const meetingId = useMeetingStore((s) => s.meetingId);
  const isHost = useMeetingStore((s) => s.isHost);
  const role = isHost ? "host" : "participant";

  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    (async () => {
      try {
        await initMeetingInfo();
      } catch (e) {
        console.debug("[Zoom Apps] SDK not available or init failed:", e);
      }
    })();
  }, []);

  useEffect(() => {
    if (!meetingId) return;

    console.log("Emitting socket event with meetingId:", meetingId);

    initAgendaSockets();
    initSettingsSockets();

    socket.emit("joinMeeting", meetingId);
    socket.emit("agenda:get");
    socket.emit("timer:get", meetingId);
  }, [meetingId]);

  useEffect(() => {
    (async () => {
      try {
        await loadMeetingTimerSettings();
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    setClientMounted(true);
  }, []);

  return (
    <aside className="fixed left-0 top-0 h-[100svh] max-h-[1000px] flex flex-col w-full max-w-[400px] bg-[var(--primary)] transition-width duration-100 ease-in-out space-y-2">
      <div id="main" className="flex flex-col flex-grow justify-center space-y-2 min-h-0">
        <div id="header" className="flex-shrink-0 bg-[var(--secondary)] pb-2 rounded-b-xl shadow-md">
          <Header role={role} />
        </div>

        <div className="flex-1 min-h-0 relative overflow-hidden rounded-md">
          <div className="overflow-y-auto h-full rounded-lg px-4">
            {showSettings ? (
              <Settings />
            ) : clientMounted ? (
              <Suspense fallback={<div className="py-4">Loading agenda…</div>}>
                <Agenda role={role} />
              </Suspense>
            ) : (
              <div className="py-4">Loading agenda…</div>
            )}
          </div>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8" />
        </div>

        <div className="flex-shrink-0 justify-center border-t border-gray-200">
          {isEditingMode && !showSettings && <BtnCancelSave />}
          <Suspense fallback={<div className="px-4 py-3">Loading requests…</div>}>
            <NudgeStatsPanel />
          </Suspense>
        </div>
      </div>
    </aside>
  );
}
