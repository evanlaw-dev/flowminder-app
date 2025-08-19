require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { pool } = require('./db/pool');
const { attachAllSockets } = require('./sockets');
const { agendaBroadcastFromDb } = require('./sockets/agenda');
// const { markParticipantJoined } = require("./sockets/nudge.js"); // TO-DELETE AFTER TEST
const stateRoutes = require("./routes/state");


// middleware to parse zoomroute
const zoomRoutes = require('./routes/zoomRoute.js');
// Import and use meeting routes
const meetingRoutes = require('./routes/meetingRoutes');


const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_, res) => res.send('Server is running'));

app.use("/state", stateRoutes);
// Zoom routes
app.use('/zoom', zoomRoutes);
app.use('/api/meetings', meetingRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'DELETE', 'PATCH', 'PUT'] },
  path: '/socket.io',
});

// TEST - DELETE WHEN DONE
if (process.env.NODE_ENV !== "production") {
  app.post("/dev/roster/join", async (req, res) => {
    const { meetingId, userId, name } = req.body;
    try {
      // 1) Ensure zoom_users row exists
      await pool.query(
        `INSERT INTO zoom_users (user_id, display_name)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId, name || userId]
      );

      // 2) Create/flip nudges row to in_meeting=true and broadcast delta
      await markParticipantJoined(io, pool, { meetingId, userId });

      res.json({ ok: true });
    } catch (e) {
      console.error("dev/roster/join", e);
      res.status(500).json({ ok: false, error: e.detail || e.message });
    }
  });
}



attachAllSockets(io, pool);

// Test PostgreSQL connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Railway Database connection failed:', err);
  } else {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/flowminder';
    const parsedUrl = new URL(connectionString);

    const host = parsedUrl.hostname;
    const port = parsedUrl.port;
    const database = parsedUrl.pathname.replace('/', '');
    const user = parsedUrl.username;

    console.log(`\x1b[35mConnected to PostgreSQL at ${host}:${port}\x1b[0m`);
    console.log(`\x1b[35mHost: ${host} | Database: ${database} | User: ${user} | Time: ${res.rows[0].now}\x1b[0m`);
  }
});


/* ---------------- REST: agenda items ---------------- */

app.post('/agenda_items', async (req, res) => {
  const { meeting_id, agenda_item, duration_seconds } = req.body;
  try {
    // Get the next order_index for this meeting
    const orderResult = await pool.query(
      `SELECT COALESCE(MAX(order_index), -1) + 1 as next_order_index
       FROM agenda_items 
       WHERE meeting_id = $1`,
      [meeting_id]
    );

    const nextOrderIndex = orderResult.rows[0].next_order_index;

    const result = await pool.query(
      `INSERT INTO agenda_items (meeting_id, agenda_item, duration_seconds, order_index)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [meeting_id, agenda_item, duration_seconds, nextOrderIndex]
    );
    await agendaBroadcastFromDb(io, pool);
    res.json({ success: true, item: result.rows[0] });
  } catch (err) {
    console.error('Error inserting into agenda_items:', err);
    res.status(500).json({ success: false, error: 'Failed to save agenda item' });
  }
});

app.delete('/agenda_items', async (req, res) => {
  const { meeting_id } = req.query;
  if (!meeting_id) return res.status(400).json({ success: false, error: 'Missing meeting_id' });
  try {
    await pool.query('DELETE FROM agenda_items WHERE meeting_id = $1', [meeting_id]);
    await agendaBroadcastFromDb(io, pool);
    res.json({ success: true, message: 'All agenda items cleared' });
  } catch (error) {
    console.error('Error clearing agenda items:', error);
    res.status(500).json({ success: false, error: 'Failed to clear agenda items' });
  }
});

app.get('/agenda_items', async (req, res) => {
  const { meeting_id } = req.query;
  if (!meeting_id) return res.status(400).json({ success: false, error: 'Missing meeting_id' });
  try {
    const result = await pool.query(
      `SELECT id, meeting_id, agenda_item, duration_seconds, status
       FROM agenda_items
       WHERE meeting_id = $1
       ORDER BY
         order_index ASC NULLS LAST,
         created_at ASC NULLS LAST`,
      [meeting_id]
    );
    res.json({ success: true, items: result.rows });
  } catch (error) {
    console.error('Error fetching agenda items:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch agenda items' });
  }
});

app.post('/agenda_items/batch-process', async (req, res) => {
  const { meeting_id, items } = req.body;
  if (!meeting_id) return res.status(400).json({ success: false, error: 'Missing meeting_id' });
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ success: false, error: 'Invalid payload' });
  }

  const now = new Date().toISOString();
  const statusCase = [];
  const processedAtCase = [];
  const values = [meeting_id];
  const processedAtValues = [];

  items.forEach(({ id, isProcessed }, idx) => {
    const idPos = idx + 2;
    const processedAtPos = idPos + items.length;

    statusCase.push(`WHEN id = $${idPos} THEN '${isProcessed ? 'processed' : 'pending'}'`);
    processedAtCase.push(`WHEN id = $${idPos} THEN $${processedAtPos}::timestamptz`);

    values.push(id);
    processedAtValues.push(isProcessed ? now : null);
  });

  values.push(...processedAtValues);
  const idPlaceholders = values.slice(1, items.length + 1).map((_, i) => `$${i + 2}`).join(', ');

  const query = `
    UPDATE agenda_items
    SET
      status = CASE ${statusCase.join(' ')} END,
      processed_at = CASE ${processedAtCase.join(' ')} END
    WHERE meeting_id = $1
      AND id IN (${idPlaceholders})
  `;
  try {
    await pool.query(query, values);
    await agendaBroadcastFromDb(io, pool);
    res.json({ success: true, updated: items.length });
  } catch (err) {
    console.error('Batch update failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/agenda_items/:id', async (req, res) => {
  const { id } = req.params;
  const { agenda_item, duration_seconds } = req.body;
  try {
    const result = await pool.query(
      `UPDATE agenda_items
       SET agenda_item = COALESCE($2, agenda_item),
           duration_seconds = COALESCE($3, duration_seconds)
       WHERE id = $1 RETURNING *`,
      [id, agenda_item, duration_seconds]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Agenda item not found' });
    await agendaBroadcastFromDb(io, pool);
    res.json({ success: true, item: result.rows[0] });
  } catch (err) {
    console.error('Error updating agenda item:', err);
    res.status(500).json({ success: false, error: 'Failed to update agenda item' });
  }
});

app.delete('/agenda_items/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM agenda_items WHERE id::text = $1 RETURNING *', [id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Agenda item not found' });
    await agendaBroadcastFromDb(io, pool);
    res.json({ success: true, item: result.rows[0] });
  } catch (err) {
    console.error('Error deleting agenda item:', err);
    res.status(500).json({ success: false, error: 'Could not delete agenda item' });
  }
});


// POST /nudge - Send a nudge to a specific participant
app.post('/nudge', async (req, res) => {
  const { meeting_id, participant_id, nudge_type, message } = req.body;
  if (!meeting_id || !participant_id || !nudge_type) {
    return res.status(400).json({ success: false, error: 'Meeting ID, participant ID, and nudge type are required' });
  }
  const timestamp = new Date().toISOString();
  try {
    await pool.query(
      'INSERT INTO nudges (meeting_id, participant_id, nudge_type, message, timestamp) VALUES ($1, $2, $3, $4, $5)',
      [meeting_id, participant_id, nudge_type, message, timestamp]
    );
    io.to(meeting_id).emit('nudge', { meeting_id, participant_id, nudge_type, message, timestamp });
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending nudge:', error);
    res.status(500).json({ success: false, error: 'Failed to send nudge' });
  }
});

// PUT /meetings/zoom/:zoom_meeting_id
// - Upserts a meeting by its Zoom meeting ID (natural key)
// - Returns the full meeting record (including canonical UUID `id`)
// - 201 Created if inserted, 200 OK if it already existed

// Ensure this UNIQUE exists once:
// ALTER TABLE public.meetings
//   ADD CONSTRAINT meetings_zoom_meeting_id_key UNIQUE (zoom_meeting_id);

app.put('/meetings/zoom/:zoom_meeting_id', async (req, res) => {
  const { zoom_meeting_id } = req.params;
  if (!zoom_meeting_id) {
    return res.status(400).json({ error: 'zoom_meeting_id is required in the path' });
  }

  const {
    host_email = null,
    meeting_title = null,
    scheduled_start = null,
    actual_start = null,
    actual_end = null,
    participant_count = null,
    duration_seconds = null,
    summary_notes = null,
    host_id = null,
  } = req.body || {};

  try {
    const pre = await pool.query(
      'SELECT id FROM public.meetings WHERE zoom_meeting_id = $1',
      [zoom_meeting_id]
    );
    const existed = pre.rows.length > 0;
    
    if (!existed) {
      const upsert = await pool.query(
        `
      INSERT INTO public.meetings (
        zoom_meeting_id,
        host_email,
        meeting_title,
        scheduled_start,
        actual_start,
        actual_end,
        meeting_status,
        participant_count,
        duration_seconds,
        summary_notes,
        host_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,'in_progress',$7,$8,$9,$10)
      ON CONFLICT ON CONSTRAINT meetings_zoom_meeting_id_key DO UPDATE
      SET
        host_email        = COALESCE(EXCLUDED.host_email,        public.meetings.host_email),
        meeting_title     = COALESCE(EXCLUDED.meeting_title,     public.meetings.meeting_title),
        scheduled_start   = COALESCE(EXCLUDED.scheduled_start,   public.meetings.scheduled_start),
        actual_start      = COALESCE(EXCLUDED.actual_start,      public.meetings.actual_start),
        actual_end        = COALESCE(EXCLUDED.actual_end,        public.meetings.actual_end),
        meeting_status    = 'in_progress',
        participant_count = COALESCE(EXCLUDED.participant_count, public.meetings.participant_count),
        duration_seconds  = COALESCE(EXCLUDED.duration_seconds,  public.meetings.duration_seconds),
        summary_notes     = COALESCE(EXCLUDED.summary_notes,     public.meetings.summary_notes),
        host_id           = COALESCE(EXCLUDED.host_id,           public.meetings.host_id)
      RETURNING *;
      `,
        [
          zoom_meeting_id,
          host_email,
          meeting_title,
          scheduled_start,
          actual_start,
          actual_end,
          participant_count,
          duration_seconds,
          summary_notes,
          host_id,
        ]
      );
        const meeting = upsert.rows[0];
        res.setHeader('Location', `/meetings/${meeting.id}`);
        res.status(existed ? 200 : 201).json(meeting);
      } else {
        const meeting = pre.rows[0];
        res.setHeader('Location', `/meetings/${meeting.id}`);
        res.status(existed ? 200 : 201).json(meeting);
    }
  } catch (err) {
    console.error('PUT /meetings/zoom/:zoom_meeting_id failed:', {
      message: err?.message,
      code: err?.code,
      detail: err?.detail,
      position: err?.position,
      stack: err?.stack,
    });
    return res.status(500).json({ error: 'Failed to upsert meeting' });
  }
});



app.get('/meetings/:id/timer-settings', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT timer_settings FROM public.meetings WHERE id::text = $1', [id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Meeting not found' });
    res.json({ success: true, timer_settings: rows[0].timer_settings });
  } catch (err) {
    console.error('Fetch timer_settings failed:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch timer settings' });
  }
});

app.put('/meetings/:id/timer-settings', async (req, res) => {
  const { id } = req.params;
  const incoming = req.body || {};
  try {
    const { rows } = await pool.query(
      `UPDATE public.meetings
       SET timer_settings = jsonb_set($2::jsonb, '{updatedAt}', to_jsonb(now() at time zone 'utc'), true)
       WHERE id::text = $1 RETURNING timer_settings`,
      [id, incoming]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Meeting not found' });
    // broadcast new settings to everyone in this meeting room
    io.to(id).emit('settings:update', {
      timer_settings: rows[0].timer_settings,
      serverTime: Date.now(),
    });

    res.json({ success: true, timer_settings: rows[0].timer_settings });
  } catch (err) {
    console.error('Update timer_settings failed:', err);
    res.status(500).json({ success: false, error: 'Failed to update timer settings' });
  }
});

app.get('/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
