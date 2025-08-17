// frontend/app/page.tsx
"use client";

import React, { Suspense, useEffect } from "react";
// import { useSearchParams } from "next/navigation";
import { useAgendaStore } from "@/stores/useAgendaStore";
import { loadMeetingTimerSettings } from "@/services/agendaService";
import { initAgendaSockets } from "@/sockets/agenda";
import { initSettingsSockets } from "@/sockets/settings";
import { socket } from "../sockets/socket";
// import { MEETING_ID } from "@/config/constants";
import zoomSdk from "@zoom/appssdk";

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
// adding a comment for deployment
function HomeContent() {
  // const searchParams = useSearchParams();
  // const role = searchParams.get("role") === "host" ? "participant" : "host";
  const [role, setRole] = React.useState<"host" | "participant">("participant");

  const [mounted, setMounted] = React.useState(false); // 👈 gate hydration
  //
  const { isEditingMode, showSettings, MEETING_ID, setMeetingId, setCurrentUserId } = useAgendaStore();
  
  /* Initialize Zoom Apps SDK and log meeting & user IDs when running inside Zoom
  *
  *  meetingCtx?.meetingID = meeting ID
  *  userCtx?.role = role (host/attendee)
  */ 
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Configure SDK with only the capabilities we need
        await zoomSdk.config({
          capabilities: ["getMeetingContext", "getUserContext", "getMeetingUUID"],
        });

        const meetingCtx = await zoomSdk.getMeetingContext();
        const userCtx = await zoomSdk.getUserContext();
        const meetingUUID = await zoomSdk.getMeetingUUID();

        if (!mounted) return;

        // Log to console for now the meeting id
        console.log(
          `[Zoom Apps] meetingID=${meetingCtx?.meetingID} | eetingUUID=${meetingUUID?.meetingUUID} | meetingTopic=${meetingCtx?.meetingTopic}`
        );
        console.log(
          `[Zoom Apps] user screenName=${userCtx?.screenName} | participantId=${userCtx?.participantUUID} | role=${userCtx?.role} | status=${userCtx?.status}`
        );

        // Set role based on the returned value of getUserContext response
        setRole(userCtx?.role === "host" ? "host" : "participant");

        console.log('MEETING ID:' + MEETING_ID);

        const meetingId = meetingCtx?.meetingID;
        const currentUserId = userCtx?.participantUUID;

        console.log('Meeting Id:' + meetingId + ',current user id:', currentUserId);

        if (!meetingId) {
          setMeetingId("Default_Meeting_ID");
        } else {
          console.log('setting meeting id.');
          setMeetingId(meetingId);
        }
        if (!currentUserId) {
          setCurrentUserId("Default_User_ID");
        } else {
          console.log('setting user id.');
          setCurrentUserId(currentUserId);
        }

        console.log('MEETING ID:' + MEETING_ID);

      } catch (e) {
        // Not running inside Zoom or SDK not available; keep silent in production
        console.debug("[Zoom Apps] SDK not available or init failed:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  
  // emit initial socket events
  useEffect(() => {
    initAgendaSockets();
    initSettingsSockets();
    socket.emit("joinMeeting", MEETING_ID);
    socket.emit("agenda:get");
    socket.emit("timer:get", MEETING_ID);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // wait until client mounted to render the list
    setMounted(true);
  }, []);

  return (
    <aside className="fixed left-0 top-0 h-[100svh] max-h-[1000px] flex flex-col w-full max-w-[400px]                      bg-[var(--primary)] transition-width duration-100 ease-in-out space-y-2">
      <div id="main" className="flex flex-col flex-grow justify-center space-y-2 min-h-0">
        <div id="header" className="flex-shrink-0 bg-[var(--secondary)] pb-2 rounded-b-xl shadow-md">
          <Header role={role} />
        </div>

        <div className="flex-1 min-h-0 relative overflow-hidden rounded-md">
          <div className="overflow-y-auto h-full rounded-lg px-4">
            {showSettings ? (
              <Settings />
            ) : (
              <div>
                {/* 👇 Only render Agenda after mount to avoid SSR/CSR mismatch */}
                {mounted ? (
                  <Suspense fallback={<div className="py-4">Loading agenda…</div>}>
                    <Agenda role={role} />
                  </Suspense>
                ) : (
                  <div className="py-4">Loading agenda…</div>
                )}
              </div>
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
