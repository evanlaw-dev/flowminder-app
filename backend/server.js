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


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE']
  }
});

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/flowminder'
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
    const result = await pool.query(
      `INSERT INTO agenda_items 
        (meeting_id, agenda_item, duration_seconds) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [meeting_id, agenda_item, duration_seconds]
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
      `SELECT id, meeting_id, agenda_item, duration_seconds, order_index, actual_start, actual_end, status, created_at
       FROM agenda_items
       WHERE meeting_id = $1
       ORDER BY order_index ASC NULLS LAST, created_at ASC`,
      [meeting_id]
    );
    res.json({ success: true, items: result.rows });
  } catch (error) {
    console.error('Error fetching agenda items:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch agenda items' });
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});