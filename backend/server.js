// Express + Socket.IO + PostgreSQL Backend for flowminder-app
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');
const { Parser } = require('json2csv');

// middleware to parse zoomroute
const zoomRoutes = require('./routes/zoomRoute.js');

// Import and use meeting routes
const meetingRoutes = require('./routes/meetingRoutes');


const app = express();
app.use(cors());
app.use(express.json());

//Temporary 
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Zoom routes
app.use('/zoom', zoomRoutes);
app.use('/api/meetings', meetingRoutes);

// Use meeting routes
app.use('/api/meetings', meetingRoutes);


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE']
  }
});

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/flowminder',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

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

// In-memory session state (for undo logic)
const sessionState = {};

// Socket.IO connection
io.on('connection', (socket) => {
  socket.on('joinMeeting', (meetingId) => {
    socket.join(meetingId);
  });
});

// POST /agenda_items - Create a new agenda item
app.post('/agenda_items', async (req, res) => {
  const {
    meeting_id,
    agenda_item,
    duration_seconds,
  } = req.body;

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
      `INSERT INTO agenda_items 
        (meeting_id, agenda_item, duration_seconds, order_index) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [meeting_id, agenda_item, duration_seconds, nextOrderIndex]
    );

    res.json({ success: true, item: result.rows[0] });
  } catch (err) {
    console.error('Error inserting into agenda_items:', err);
    res.status(500).json({ success: false, error: 'Failed to save agenda item' });
  }
});

// DELETE /agenda_items?meeting_id=xxx - Clear all agenda items for a meeting
app.delete('/agenda_items', async (req, res) => {
  const { meeting_id } = req.query;

  if (!meeting_id) {
    return res.status(400).json({ success: false, error: 'Missing meeting_id' });
  }

  try {
    await pool.query(
      'DELETE FROM agenda_items WHERE meeting_id = $1',
      [meeting_id]
    );
    res.json({ success: true, message: 'All agenda items cleared' });
  } catch (error) {
    console.error('Error clearing agenda items:', error);
    res.status(500).json({ success: false, error: 'Failed to clear agenda items' });
  }
});

// GET /agenda_items?meeting_id=xxx - Fetch agenda items for a meeting
app.get('/agenda_items', async (req, res) => {
  const { meeting_id } = req.query;

  if (!meeting_id) {
    return res.status(400).json({ success: false, error: 'Missing meeting_id' });
  }

  try {
    const result = await pool.query(
      `SELECT id, meeting_id, agenda_item, duration_seconds, order_index
       FROM agenda_items
       WHERE meeting_id = $1
       ORDER BY order_index ASC`,
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

  if (!meeting_id) {
    return res.status(400).json({ success: false, error: 'Missing meeting_id' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'Invalid payload' });
  }

const now = new Date().toISOString();
const statusCase = [];
const processedAtCase = [];
const values = [meeting_id]; // $1 = meeting_id

const processedAtValues = [];

items.forEach(({ id, isProcessed }, idx) => {
  const idPos = idx + 2; // $2, $3, ...
  const processedAtPos = idPos + items.length; // for processed_at params after all IDs

  statusCase.push(`WHEN id = $${idPos} THEN '${isProcessed ? 'processed' : 'pending'}'`);
  processedAtCase.push(`WHEN id = $${idPos} THEN $${processedAtPos}::timestamptz`);

  values.push(id);
  processedAtValues.push(isProcessed ? now : null);
});

// Append processed_at values at the end of the values array
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
  res.json({ success: true, updated: items.length });
} catch (err) {
  console.error('Batch update failed:', err);
  res.status(500).json({ success: false, error: err.message });
}
});


// PATCH /agenda_items/:id - Update an existing agenda item
app.patch('/agenda_items/:id', async (req, res) => {
  const { id } = req.params;
  const { agenda_item, duration_seconds } = req.body;

  try {
    const result = await pool.query(
      `UPDATE agenda_items
       SET agenda_item = COALESCE($2, agenda_item),
           duration_seconds = COALESCE($3, duration_seconds)
       WHERE id = $1
       RETURNING *`,
      [
        id,
        agenda_item,
        duration_seconds,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Agenda item not found' });
    }
    res.json({ success: true, item: result.rows[0] });
  } catch (err) {
    console.error('Error updating agenda item:', err);
    res.status(500).json({ success: false, error: 'Failed to update agenda item' });
  }
});

// DELETE /agenda_items/:id - Delete an agenda item by ID
app.delete('/agenda_items/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM agenda_items WHERE id::text = $1 RETURNING *',
      [id]
    );

    if (!result.rows.length) {
      console.log(`Agenda item with ID ${id} not found in DB.`);
      return res.status(404).json({ success: false, error: 'Agenda item not found' });
    }

    res.json({ success: true, item: result.rows[0] });
  } catch (err) {
    console.error('Error deleting agenda item:', err);
    res.status(500).json({ success: false, error: 'Could not delete agenda item' });
  }
});

// POST /action - Log a meeting action
app.post('/action', async (req, res) => {
  const { meeting_id, action_type } = req.body;
  if (!meeting_id || !action_type) {
    return res.status(400).json({ success: false, error: 'Meeting ID and action type are required' });
  }
  const timestamp = new Date().toISOString();
  try {
    await pool.query(
      'INSERT INTO actions (meeting_id, action_type, timestamp) VALUES ($1, $2, $3)',
      [meeting_id, action_type, timestamp]
    );
    sessionState[meeting_id] = { action_type, timestamp };
    io.to(meeting_id).emit('action', { meeting_id, action_type, timestamp });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to record action' });
  }
});

// GET /actions/:meetingId - Return full action history
app.get('/actions/:meetingId', async (req, res) => {
  const { meetingId } = req.params;
  try {
    const result = await pool.query(
      'SELECT action_type, timestamp FROM actions WHERE meeting_id = $1 ORDER BY timestamp DESC',
      [meetingId]
    );
    res.json({ success: true, actions: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch actions' });
  }
});

// DELETE /action/last/:meetingId - Undo last action
app.delete('/action/last/:meetingId', async (req, res) => {
  const { meetingId } = req.params;
  const last = sessionState[meetingId];
  if (!last) {
    return res.status(404).json({ success: false, error: 'No actions to undo' });
  }
  try {
    await pool.query(
      'DELETE FROM actions WHERE meeting_id = $1 AND action_type = $2 AND timestamp = $3',
      [meetingId, last.action_type, last.timestamp]
    );
    delete sessionState[meetingId];
    io.to(meetingId).emit('undo', { meeting_id: meetingId, action_type: last.action_type, timestamp: last.timestamp });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to undo last action' });
  }
});

// GET /download/:meetingId - Export meeting history as CSV
app.get('/download/:meetingId', async (req, res) => {
  const { meetingId } = req.params;
  try {
    const result = await pool.query(
      'SELECT action_type, timestamp FROM actions WHERE meeting_id = $1 ORDER BY timestamp DESC',
      [meetingId]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: 'No actions found' });
    }
    const parser = new Parser({ fields: ['action_type', 'timestamp'] });
    const csv = parser.parse(result.rows);
    res.header('Content-Type', 'text/csv');
    res.attachment(`meeting_${meetingId}_history.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to export actions as CSV' });
  }
});

// GET /participants?meeting_id=xxx - Get all participants for a meeting
app.get('/participants', async (req, res) => {
  const { meeting_id } = req.query;

  if (!meeting_id) {
    return res.status(400).json({ success: false, error: 'Missing meeting_id' });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, email, role FROM meeting_participants WHERE meeting_id = $1 ORDER BY name ASC',
      [participant_id, meeting_id]
    );
    
    res.json({ success: true, participants: result.rows });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch participants' });
  }
});

// POST /participants - Add a participant to a meeting
app.post('/participants', async (req, res) => {
  const { meeting_id, name, email, role = 'participant' } = req.body;
  
  if (!meeting_id || !name) {
    return res.status(400).json({ success: false, error: 'Meeting ID and name are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO meeting_participants (meeting_id, name, email, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [meeting_id, name, email, role]
    );
    res.json({ success: true, participant: result.rows[0] });
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ success: false, error: 'Failed to add participant' });
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
    // Save nudge to database
    await pool.query(
      'INSERT INTO nudges (meeting_id, participant_id, nudge_type, message, timestamp) VALUES ($1, $2, $3, $4, $5)',
      [meeting_id, participant_id, nudge_type, message, timestamp]
    );

    // Emit nudge to all clients in the meeting
    io.to(meeting_id).emit('nudge', { 
      meeting_id, 
      participant_id, 
      nudge_type, 
      message, 
      timestamp 
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error sending nudge:', error);
    res.status(500).json({ success: false, error: 'Failed to send nudge' });
  }
});

// GET /nudge-stats?meeting_id=xxx - Get nudge statistics for a meeting
app.get('/nudge-stats', async (req, res) => {
  const { meeting_id } = req.query;

  if (!meeting_id) {
    return res.status(400).json({ success: false, error: 'Missing meeting_id' });
  }

  try {
    const result = await pool.query(
      `SELECT 
        nudge_type,
        COUNT(*) as count
       FROM nudges 
       WHERE meeting_id = $1 
       GROUP BY nudge_type`,
      [meeting_id]
    );

    const stats = {
      move_along_count: 0,
      invite_speak_count: 0
    };

    result.rows.forEach(row => {
      if (row.nudge_type === 'move_along') {
        stats.move_along_count = parseInt(row.count);
      } else if (row.nudge_type === 'invite_speak') {
        stats.invite_speak_count = parseInt(row.count);
      }
    });

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching nudge stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch nudge stats' });
  }
});

// DELETE /nudge-stats?meeting_id=xxx - Reset nudge statistics for a meeting
app.delete('/nudge-stats', async (req, res) => {
  const { meeting_id } = req.query;

  if (!meeting_id) {
    return res.status(400).json({ success: false, error: 'Missing meeting_id' });
  }

  try {
    await pool.query(
      'DELETE FROM nudges WHERE meeting_id = $1',
      [meeting_id]
    );
    
    res.json({
      success: true,
      message: 'Nudge statistics reset successfully'
    });
  } catch (error) {
    console.error('Error resetting nudge stats:', error);
    res.status(500).json({ success: false, error: 'Failed to reset nudge stats' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});