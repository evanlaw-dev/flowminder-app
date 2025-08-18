// frontend/app/page.tsx
"use client";

import React, { Suspense, useEffect } from "react";
import { useAgendaStore } from "@/stores/useAgendaStore";
import { loadMeetingTimerSettings } from "@/services/agendaService";
import { initAgendaSockets } from "@/sockets/agenda";
import { initSettingsSockets } from "@/sockets/settings";
import { socket } from "../sockets/socket";
import zoomSdk from "@zoom/appssdk";
import { setMeetingId, setCurrentUserId, BACKEND_URL } from "../config/constants";

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
  const [role, setRole] = React.useState<"host" | "participant">("participant");
  const [clientMounted, setClientMounted] = React.useState(false);
  const [meetingId, setMeetingIdState] = React.useState<string | null>(null);
  const [userId, setUserIdState] = React.useState<string | null>(null);

  const { isEditingMode, showSettings } = useAgendaStore();

  // Initialize Zoom SDK and capture IDs
  useEffect(() => {
    let isAlive = true;

    (async () => {
      try {
        await zoomSdk.config({
          capabilities: ["getMeetingContext", "getUserContext", "getMeetingUUID"],
        });

        const [meetingCtx, userCtx, meetingUUID] = await Promise.all([
          zoomSdk.getMeetingContext(),
          zoomSdk.getUserContext(),
          zoomSdk.getMeetingUUID(),
        ]);

        if (!isAlive) return;

        console.log(
          `[Zoom Apps] meetingID=${meetingCtx?.meetingID} | meetingUUID=${meetingUUID?.meetingUUID} | meetingTopic=${meetingCtx?.meetingTopic}`
        );
        console.log(
          `[Zoom Apps] user screenName=${userCtx?.screenName} | participantId=${userCtx?.participantUUID} | role=${userCtx?.role} | status=${userCtx?.status}`
        );

        setRole(userCtx?.role === "host" ? "host" : "participant");

        const mId = meetingUUID?.meetingUUID;
        const uId = userCtx?.participantUUID;

        // Update local state first (source of truth for this component)
        setMeetingIdState(mId);
        setUserIdState(uId);

        // If you still need globals elsewhere, update them too
        setMeetingId(mId);
        setCurrentUserId(uId);

        // This POST should use the freshly resolved IDs, not stale imports
        await fetch(`${BACKEND_URL}/update-meeting`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ meetingId: mId, userId: uId }),
        });
      } catch (e) {
        console.debug("[Zoom Apps] SDK not available or init failed:", e);
      }
    })();

    return () => {
      isAlive = false;
    };
  }, []);

  // Initialize sockets *after* we have a real meetingId/userId
  useEffect(() => {
    if (!meetingId || !userId) return;

    console.log("Emitting socket event with IDs:", { meetingId, userId });

    initAgendaSockets();
    initSettingsSockets();

    socket.emit("joinMeeting", meetingId);
    socket.emit("agenda:get");
    socket.emit("timer:get", meetingId);
  }, [meetingId, userId]);

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
