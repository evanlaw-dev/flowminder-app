// frontend/app/page.tsx
"use client";

import React, { Suspense, useEffect } from "react";
import { useAgendaStore } from "@/stores/useAgendaStore";
import { initAgendaSockets } from "@/sockets/agenda";
import { initSettingsSockets } from "@/sockets/settings";
import { socket } from "../sockets/socket";
import {
  // setMeetingId as setFrontendMeetingId,
  syncAndSetMeeting,
} from "../config/constants";

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

  // Holds the canonical UUID from your DB
  const [meetingId, setMeetingIdState] = React.useState<string | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);

  const { isEditingMode, showSettings } = useAgendaStore();

  // Bootstrap: fetch Zoom + user, upsert to backend, then set state + globals
  useEffect(() => {
    let isAlive = true;

    (async () => {
      try {
        // In production, pull these from zoomSdk
        // const [meetingCtx, userCtx] = await Promise.all([
        //   zoomSdk.getMeetingContext(),
        //   zoomSdk.getUserContext(),
        // ]);
        // const zoomMeetingId = meetingCtx?.meetingID ?? null;
        // const userIdFromSdk = userCtx?.participantUUID ?? null;
        // const roleFromSdk = userCtx?.role === "host" ? "host" : "participant";

        const zoomMeetingId = "81941987684";     //  TEMP
        const userIdFromSdk = "12389";           // TEMP
        const roleFromSdk: "host" | "participant" = "host";

        if (!isAlive) return;

        // 1) Set role and user immediately from locals
        setRole(roleFromSdk);
        setUserId(userIdFromSdk);

        // 2) Upsert meeting and obtain canonical UUID
        let canonicalMeetingUUID: string | null = null;
        if (zoomMeetingId) {
          canonicalMeetingUUID = await syncAndSetMeeting(zoomMeetingId);
        }

        if (!isAlive) return;

        if (canonicalMeetingUUID) {
          // 3) Use the known value to update both state and your global holder
          setMeetingIdState(canonicalMeetingUUID);
          if (process.env.NODE_ENV !== "production") {
            console.log("[Home] Set canonical meetingId:", canonicalMeetingUUID);
          }
        } else {
          console.warn("[Home] No canonical meeting UUID returned from backend.");
        }
      } catch (e) {
        console.debug("[Home] Bootstrap failed:", e);
      }
    })();

    return () => {
      isAlive = false;
    };
  }, []);

  // React *after* state has updated
  useEffect(() => {
    if (meetingId) console.log("[Home] meetingId changed:", meetingId);
  }, [meetingId]);

  useEffect(() => {
    if (userId) console.log("[Home] userId changed:", userId);
  }, [userId]);

  // Initialize sockets only when both IDs are present
  useEffect(() => {
    if (!meetingId || !userId) return;

    if (process.env.NODE_ENV !== "production") {
      console.log("[Home] Initializing sockets with IDs:", { meetingId, userId });
    }

    initAgendaSockets();
    initSettingsSockets();

    // If your server expects an object payload, send { meetingId }
    socket.emit("joinMeeting", { meetingId });
    socket.emit("agenda:get", { meetingId });
    socket.emit("timer:get", { meetingId });
  }, [meetingId, userId]);

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
