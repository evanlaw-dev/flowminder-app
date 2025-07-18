CREATE TABLE agenda_items (
  id SERIAL PRIMARY KEY,
  meeting_id VARCHAR(255) NOT NULL,
  agenda_item TEXT NOT NULL,
  duration_seconds INTEGER,
  timer_value INTEGER DEFAULT 0,
  is_running BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMP DEFAULT NOW(),
  initial_value INTEGER DEFAULT 0
); 