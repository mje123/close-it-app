-- Run this in the Supabase SQL Editor to set up the database schema

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  license_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calculations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  calc_type TEXT NOT NULL CHECK (calc_type IN ('buyer', 'seller')),
  purchase_price NUMERIC,
  down_payment NUMERIC,
  interest_rate NUMERIC,
  location_state TEXT,
  location_county TEXT,
  loan_type TEXT,
  all_inputs TEXT NOT NULL,
  calculated_results TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
