// Express + Socket.IO + PostgreSQL Backend for flowminder-app
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');
const { Parser } = require('json2csv');
const zoomRoutes = require('./routes/zoomRoute.js');
const agendaController = require('./controllers/agendaController.js');

const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());

//Temporary 
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Test endpoint for agenda items (without database)
app.post('/agenda/test', (req, res) => {
  const { meeting_id, agenda_item, duration_seconds } = req.body;
  console.log('Received agenda item:', { meeting_id, agenda_item, duration_seconds });
  
  // Return a mock response
  res.json({ 
    success: true, 
    item: {
      id: Date.now().toString(),
      meeting_id,
      agenda_item,
      duration_seconds,
      timer_value: duration_seconds,
      is_running: false,
      initial_value: duration_seconds,
      created_at: new Date().toISOString()
    }
  });
});

// Zoom routes
app.use('/zoom', zoomRoutes);

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

// POST /agenda - Create a new agenda item
app.post('/agenda', (req, res) => agendaController.createAgendaItem(pool, req, res));

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

// GET /agenda?meeting_id=... - Fetch all agenda items for a meeting (with timer state)
app.get('/agenda', (req, res) => agendaController.getAgendaItems(pool, req, res));

// PATCH /agenda/:id/timer - Update timer state for an agenda item
app.patch('/agenda/:id/timer', (req, res) => agendaController.updateAgendaTimer(pool, req, res));

// POST /agenda/:id/timer/reset - Reset timer for an agenda item to its initial value
app.post('/agenda/:id/timer/reset', (req, res) => agendaController.resetAgendaTimer(pool, req, res));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
}); 