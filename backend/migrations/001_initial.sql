-- Civic Complaint System - Initial Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Officers / Admin Users
CREATE TABLE IF NOT EXISTS officers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'officer' CHECK (role IN ('super_admin', 'officer')),
  department VARCHAR(100),
  badge_number VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Complaints
CREATE TABLE IF NOT EXISTS complaints (
  id SERIAL PRIMARY KEY,
  complaint_id VARCHAR(20) UNIQUE NOT NULL,  -- e.g. KA-2026-00421
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'theft', 'harassment', 'missing_person', 'traffic_incident',
    'noise_disturbance', 'cyber_crime', 'other'
  )),
  description TEXT NOT NULL,
  location_text TEXT,
  location_lat DECIMAL(10, 7),
  location_lng DECIMAL(11, 7),
  complainant_name VARCHAR(100),
  complainant_phone VARCHAR(20) NOT NULL,
  attachment_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'resolved', 'rejected'
  )),
  assigned_officer_id INTEGER REFERENCES officers(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Internal notes on complaints
CREATE TABLE IF NOT EXISTS complaint_notes (
  id SERIAL PRIMARY KEY,
  complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  officer_id INTEGER NOT NULL REFERENCES officers(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp session state (keyed by phone number)
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(30) UNIQUE NOT NULL,
  state VARCHAR(50) NOT NULL DEFAULT 'WELCOME',
  language VARCHAR(10) DEFAULT 'en',
  session_data JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Complaint ID counter per year
CREATE TABLE IF NOT EXISTS complaint_counters (
  id SERIAL PRIMARY KEY,
  year INTEGER UNIQUE NOT NULL,
  last_count INTEGER NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at);
CREATE INDEX IF NOT EXISTS idx_complaints_phone ON complaints(complainant_phone);
CREATE INDEX IF NOT EXISTS idx_sessions_phone ON whatsapp_sessions(phone_number);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON whatsapp_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER officers_updated_at
  BEFORE UPDATE ON officers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Default super admin (password: Admin@1234 — CHANGE IMMEDIATELY)
INSERT INTO officers (name, email, password_hash, role, department)
VALUES (
  'Super Admin',
  'admin@police.gov.in',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewkfZy8HxpuJCF0e',
  'super_admin',
  'Headquarters'
) ON CONFLICT (email) DO NOTHING;
