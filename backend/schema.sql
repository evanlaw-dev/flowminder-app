-- Database schema for Flowminder app
-- This file contains the SQL commands to create the necessary tables

-- Meeting participants table
CREATE TABLE IF NOT EXISTS meeting_participants (
    id SERIAL PRIMARY KEY,
    meeting_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'participant',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agenda items table
CREATE TABLE IF NOT EXISTS agenda_items (
    id SERIAL PRIMARY KEY,
    meeting_id UUID NOT NULL,
    agenda_item TEXT NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    is_processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Actions table for tracking meeting actions
CREATE TABLE IF NOT EXISTS actions (
    id SERIAL PRIMARY KEY,
    meeting_id UUID NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nudges table to track sent nudges
CREATE TABLE IF NOT EXISTS nudges (
    id SERIAL PRIMARY KEY,
    meeting_id UUID NOT NULL,
    participant_id INTEGER NOT NULL REFERENCES meeting_participants(id) ON DELETE CASCADE,
    nudge_type VARCHAR(100) NOT NULL,
    message TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting_id ON meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_agenda_items_meeting_id ON agenda_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_actions_meeting_id ON actions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_nudges_meeting_id ON nudges(meeting_id);
CREATE INDEX IF NOT EXISTS idx_nudges_participant_id ON nudges(participant_id);

-- Add some sample participants for testing (optional)
-- INSERT INTO meeting_participants (meeting_id, name, email, role) VALUES 
-- ('a8f52a02-5aa8-45ec-9549-79ad2a194fa4', 'John Doe', 'john@example.com', 'participant'),
-- ('a8f52a02-5aa8-45ec-9549-79ad2a194fa4', 'Jane Smith', 'jane@example.com', 'participant'),
-- ('a8f52a02-5aa8-45ec-9549-79ad2a194fa4', 'Bob Johnson', 'bob@example.com', 'host'); 