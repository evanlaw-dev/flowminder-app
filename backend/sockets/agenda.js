let stateByMeeting = {}; // { [meetingId]: { version, agenda, currentIndex } }

function toClientItem(row) {
  return {
    id: row.id,
    text: row.agenda_item,
    timerValue: Number(row.duration_seconds || 0),
    isProcessed: row.status === "processed",
    processedAt: row.processed_at ? new Date(row.processed_at).toISOString() : null,
  };
}

async function loadFromDB(pool, meetingId) {
  const { rows } = await pool.query(
    `SELECT id, agenda_item, duration_seconds, status, processed_at
     FROM agenda_items
     WHERE meeting_id = $1
     ORDER BY
       order_index ASC NULLS LAST,
       created_at ASC NULLS LAST,
       id ASC`,
    [meetingId]
  );

  const agenda = rows.map(toClientItem);
  const firstPending = agenda.findIndex((it) => !it.isProcessed);
  return {
    version: (stateByMeeting[meetingId]?.version || 0) + 1,
    agenda,
    currentIndex: firstPending === -1 ? agenda.length : Math.max(0, firstPending),
  };
}

async function ensureState(pool, meetingId) {
  if (!stateByMeeting[meetingId]) {
    stateByMeeting[meetingId] = await loadFromDB(pool, meetingId);
  }
  return stateByMeeting[meetingId];
}

function emitSnapshot(socket, meetingId) {
  const state = stateByMeeting[meetingId];
  if (!state) return;
  socket.emit("agenda:snapshot", state);
}

function broadcastPatch(io, meetingId, patch) {
  const state = stateByMeeting[meetingId];
  if (!state) return;
  io.to(meetingId).emit("agenda:update", { ...patch, version: state.version });
}

async function persistProcessed(pool, meetingId, idsToProcessed) {
  if (!idsToProcessed.length) return;
  const now = new Date().toISOString();

  const statusCase = [];
  const processedAtCase = [];
  const values = [meetingId];
  const processedAtValues = [];

  idsToProcessed.forEach(({ id, isProcessed }, idx) => {
    const idPos = idx + 2;
    const processedAtPos = idPos + idsToProcessed.length;

    statusCase.push(
      `WHEN id = $${idPos} THEN '${isProcessed ? "processed" : "pending"}'`
    );
    processedAtCase.push(`WHEN id = $${idPos} THEN $${processedAtPos}::timestamptz`);

    values.push(id);
    processedAtValues.push(isProcessed ? now : null);
  });

  values.push(...processedAtValues);
  const idPlaceholders = values
    .slice(1, idsToProcessed.length + 1)
    .map((_, i) => `$${i + 2}`)
    .join(", ");

  const query = `
    UPDATE agenda_items
    SET
      status = CASE ${statusCase.join(" ")} END,
      processed_at = CASE ${processedAtCase.join(" ")} END
    WHERE meeting_id = $1
      AND id IN (${idPlaceholders})
  `;
  await pool.query(query, values);
}

/** Public: force-refresh from DB and broadcast (used by REST "Save") */
async function agendaBroadcastFromDb(io, pool, meetingId) {
  stateByMeeting[meetingId] = await loadFromDB(pool, meetingId);
  io.to(meetingId).emit("agenda:update", {
    agenda: stateByMeeting[meetingId].agenda,
    currentIndex: stateByMeeting[meetingId].currentIndex,
    version: stateByMeeting[meetingId].version,
  });
}

function attachAgenda(io, pool) {
  io.on("connection", (socket) => {
    socket.on("joinMeeting", async ({ meetingId }) => {
      socket.join(meetingId);
      await ensureState(pool, meetingId);
      emitSnapshot(socket, meetingId);
    });

    socket.on("agenda:get", async ({ meetingId }) => {
      await ensureState(pool, meetingId);
      emitSnapshot(socket, meetingId);
    });

    socket.on("agenda:next", async ({ meetingId }, ack) => {
      try {
        const s = await ensureState(pool, meetingId);
        const idx = s.agenda.findIndex((it) => !it.isProcessed);
        if (idx === -1) return ack?.({ ok: true, noop: true, version: s.version });

        const item = s.agenda[idx];
        item.isProcessed = true;
        item.processedAt = new Date().toISOString();

        s.currentIndex = Math.min(idx + 1, s.agenda.length);
        s.version++;

        await persistProcessed(pool, meetingId, [{ id: item.id, isProcessed: true }]);
        broadcastPatch(io, meetingId, { agenda: s.agenda, currentIndex: s.currentIndex });
        ack?.({ ok: true, version: s.version });
      } catch (e) {
        console.error("[agenda:next]", e);
        ack?.({ ok: false, error: "server error" });
      }
    });

    socket.on("agenda:prev", async ({ meetingId }, ack) => {
      try {
        const s = await ensureState(pool, meetingId);

        const lastProcessedIdx =
          s.agenda.findLastIndex?.((it) => it.isProcessed) ??
          (() => {
            for (let i = s.agenda.length - 1; i >= 0; i--)
              if (s.agenda[i].isProcessed) return i;
            return -1;
          })();

        if (lastProcessedIdx === -1)
          return ack?.({ ok: true, noop: true, version: s.version });

        const item = s.agenda[lastProcessedIdx];
        item.isProcessed = false;
        item.processedAt = null;

        const firstPending = s.agenda.findIndex((it) => !it.isProcessed);
        s.currentIndex = firstPending === -1 ? s.agenda.length : firstPending;
        s.version++;

        await persistProcessed(pool, meetingId, [{ id: item.id, isProcessed: false }]);
        broadcastPatch(io, meetingId, { agenda: s.agenda, currentIndex: s.currentIndex });
        ack?.({ ok: true, version: s.version });
      } catch (e) {
        console.error("[agenda:prev]", e);
        ack?.({ ok: false, error: "server error" });
      }
    });
  });
}

module.exports = { attachAgenda, agendaBroadcastFromDb };
