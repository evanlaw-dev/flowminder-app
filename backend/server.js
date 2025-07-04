// Express + Socket.IO + PostgreSQL Backend for flowminder-app
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');
const { Parser } = require('json2csv');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/flowminder'
});

// In-memory session state (for undo logic)
const sessionState = {};

// Socket.IO connection
io.on('connection', (socket) => {
  socket.on('joinMeeting', (meetingId) => {
    socket.join(meetingId);
  });
});

// POST /action - Log a meeting action
app.post('/action', async (req, res) => {
  const { meeting_id, action_type } = req.body;
  if (!meeting_id || !action_type) {
    return res.status(400).json({ success: false, error: 'Meeting ID and action type are required' });
  }
  const timestamp = new Date().toISOString();
  try {
    // Save to DB
    await pool.query(
      'INSERT INTO actions (meeting_id, action_type, timestamp) VALUES ($1, $2, $3)',
      [meeting_id, action_type, timestamp]
    );
    // Save to session state for undo
    sessionState[meeting_id] = { action_type, timestamp };
    // Emit to clients
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