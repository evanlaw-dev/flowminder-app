// Agenda controller for agenda item CRUD and timer endpoints

// POST /agenda - Create a new agenda item
async function createAgendaItem(pool, req, res) {
  const { meeting_id, agenda_item, duration_seconds } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO agenda_items (meeting_id, agenda_item, duration_seconds) VALUES ($1, $2, $3) RETURNING *',
      [meeting_id, agenda_item, duration_seconds]
    );
    res.json({ success: true, item: result.rows[0] });
  } catch (err) {
    console.error('Error inserting into agenda_items:', err);
    res.status(500).json({ success: false, error: 'Failed to save agenda item' });
  }
}

// GET /agenda?meeting_id=... - Fetch all agenda items for a meeting (with timer state)
async function getAgendaItems(pool, req, res) {
  const { meeting_id } = req.query;
  if (!meeting_id) {
    return res.status(400).json({ success: false, error: 'meeting_id is required' });
  }
  try {
    const result = await pool.query(
      'SELECT id, agenda_item AS text, timer_value, duration_seconds, is_running, last_updated, initial_value FROM agenda_items WHERE meeting_id = $1 ORDER BY id ASC',
      [meeting_id]
    );
    res.json({ success: true, items: result.rows });
  } catch (err) {
    console.error('Error fetching agenda items:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch agenda items' });
  }
}

// PATCH /agenda/:id/timer - Update timer state for an agenda item
async function updateAgendaTimer(pool, req, res) {
  const { id } = req.params;
  const { timer_value, is_running, last_updated, initial_value } = req.body;
  try {
    const result = await pool.query(
      `UPDATE agenda_items SET 
        timer_value = COALESCE($1, timer_value),
        is_running = COALESCE($2, is_running),
        last_updated = COALESCE($3, last_updated),
        initial_value = COALESCE($4, initial_value)
      WHERE id = $5 RETURNING *`,
      [timer_value, is_running, last_updated, initial_value, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Agenda item not found' });
    }
    res.json({ success: true, item: result.rows[0] });
  } catch (err) {
    console.error('Error updating timer state:', err);
    res.status(500).json({ success: false, error: 'Failed to update timer state' });
  }
}

// POST /agenda/:id/timer/reset - Reset timer for an agenda item to its initial value
async function resetAgendaTimer(pool, req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE agenda_items SET 
        timer_value = initial_value,
        is_running = FALSE,
        last_updated = NOW()
      WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Agenda item not found' });
    }
    res.json({ success: true, item: result.rows[0] });
  } catch (err) {
    console.error('Error resetting timer:', err);
    res.status(500).json({ success: false, error: 'Failed to reset timer' });
  }
}

module.exports = {
  createAgendaItem,
  getAgendaItems,
  updateAgendaTimer,
  resetAgendaTimer,
}; 