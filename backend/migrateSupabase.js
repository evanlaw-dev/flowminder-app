#!/usr/bin/env node

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/flowminder',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function ensureAgendaItemsIsProcessedColumn() {
  // Add is_processed boolean column if it does not exist
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'agenda_items' AND column_name = 'is_processed'
      ) THEN
        ALTER TABLE agenda_items ADD COLUMN is_processed BOOLEAN DEFAULT FALSE;
      END IF;
    END$$;
  `);
}

async function createMeetingParticipantsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS meeting_participants (
      id SERIAL PRIMARY KEY,
      meeting_id UUID NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      role VARCHAR(50) DEFAULT 'participant',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function createActionsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS actions (
      id SERIAL PRIMARY KEY,
      meeting_id UUID NOT NULL,
      action_type VARCHAR(100) NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function createNudgesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS nudges (
      id SERIAL PRIMARY KEY,
      meeting_id UUID NOT NULL,
      participant_id INTEGER NOT NULL REFERENCES meeting_participants(id) ON DELETE CASCADE,
      nudge_type VARCHAR(100) NOT NULL,
      message TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function createIndexes() {
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting_id ON meeting_participants(meeting_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_agenda_items_meeting_id ON agenda_items(meeting_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_actions_meeting_id ON actions(meeting_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_nudges_meeting_id ON nudges(meeting_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_nudges_participant_id ON nudges(participant_id);`);
}

async function main() {
  console.log('🔧 Running Supabase migration to align schema...');
  try {
    await ensureAgendaItemsIsProcessedColumn();
    await createMeetingParticipantsTable();
    await createActionsTable();
    await createNudgesTable();
    await createIndexes();
    console.log('✅ Migration complete.');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();


