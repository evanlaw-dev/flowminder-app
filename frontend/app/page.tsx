// frontend/app/page.tsx
"use client";

import React, { Suspense, useEffect } from "react";
import { useAgendaStore } from "@/stores/useAgendaStore";
// import { loadMeetingTimerSettings } from "@/services/agendaService";
import { initAgendaSockets } from "@/sockets/agenda";
import { initSettingsSockets } from "@/sockets/settings";
import { socket } from "../sockets/socket";
import zoomSdk from "@zoom/appssdk";
import {
  BACKEND_URL,
  setMeetingId as setFrontendMeetingId,
  setCurrentUserId as setFrontendCurrentUserId,
  syncMeetingToBackend,
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

  // IMPORTANT: this component-level meetingId will now hold the *canonical* UUID from your DB,
  // not the Zoom natural meetingID. Same for the global constants we set.
  const [meetingId, setMeetingIdState] = React.useState<string | null>(null);
  const [userId, setUserIdState] = React.useState<string | null>(null);

  const { isEditingMode, showSettings } = useAgendaStore();

  // --- helper: set backend in-memory MEETING_ID (backend/config/state.js) ---
  async function setBackendMeetingId(uuid: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/state/meeting`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: uuid }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        console.error("[Home] backend state set failed:", res.status, t);
      } else if (process.env.NODE_ENV !== "production") {
        console.log("[Home] backend state MEETING_ID set:", uuid);
      }
    } catch (e) {
      console.error("[Home] backend state set threw:", e);
    }
  }

  // Initialize Zoom SDK and capture IDs, then:
  // - upsert meeting with Zoom ID
  // - receive canonical UUID from backend
  // - set that UUID into both frontend constants and backend state
  useEffect(() => {
    let isAlive = true;

    (async () => {
      try {
        await zoomSdk.config({
          capabilities: ["getMeetingContext", "getUserContext"],
        });

        const [meetingCtx, userCtx] = await Promise.all([
          zoomSdk.getMeetingContext(),
          zoomSdk.getUserContext(),
        ]);

        if (!isAlive) return;
          console.log(
            `[Zoom Apps] meetingID=${meetingCtx?.meetingID} | meetingTopic=${meetingCtx?.meetingTopic}`
          );
          console.log(
            `[Zoom Apps] user screenName=${userCtx?.screenName} | participantId=${userCtx?.participantUUID} | role=${userCtx?.role} | status=${userCtx?.status}`
          );

        setRole(userCtx?.role === "host" ? "host" : "participant");

        const zoomMeetingId = meetingCtx?.meetingID;
        const participantUUID = userCtx?.participantUUID;

        // Always set the user id locally + global (unchanged behavior)
        setUserIdState(participantUUID);
        setFrontendCurrentUserId(participantUUID);

        // ---- Upsert using Zoom natural ID, then pull canonical UUID from backend ----
        let canonicalMeetingUUID: string | null = null;

        if (zoomMeetingId) {
          const synced = await syncMeetingToBackend(zoomMeetingId);
          console.log(synced);
          canonicalMeetingUUID = synced?.meetingRowId ?? null;
          console.log(canonicalMeetingUUID);
        }

        // If we got the canonical UUID, propagate it everywhere
        if (canonicalMeetingUUID) {
          // Local state for this component
          setMeetingIdState(canonicalMeetingUUID);

          // Frontend global constants state
          setFrontendMeetingId(canonicalMeetingUUID);

          // Backend in-memory state (backend/config/state.js)
          await setBackendMeetingId(canonicalMeetingUUID);
        } else {
          console.warn(
            "[Home] No canonical meeting UUID returned from backend; sockets and timers may not initialize correctly."
          );
        }
      } catch (e) {
        console.debug("[Zoom Apps] SDK not available or init failed:", e);
      }
    })();

    return () => {
      isAlive = false;
    };
  }, []);

  // Initialize sockets *after* we have the canonical meeting UUID & a user
  useEffect(() => {
    if (!meetingId || !userId) return;

    if (process.env.NODE_ENV !== "production") {
      console.log("[Home] Initializing sockets with IDs:", { meetingId, userId });
    }

    initAgendaSockets();
    initSettingsSockets();

    // Use the canonical meeting UUID for all socket rooms & queries
    socket.emit("joinMeeting", meetingId);
    socket.emit("agenda:get");
    socket.emit("timer:get", meetingId);
  }, [meetingId, userId]);

  // useEffect(() => {
  //   (async () => {
  //     try {
  //       await loadMeetingTimerSettings();
  //     } catch (e) {
  //       console.error(e);
  //     }
  //   })();
  // }, []);

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
