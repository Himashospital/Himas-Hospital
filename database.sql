-- =================================================================
-- HIMAS HOSPITAL MANAGEMENT DATABASE SCHEMA
-- Version: 3.1 (Transition Tracking Support)
-- =================================================================

-- 1. MIGRATION SCRIPT FOR EXISTING TABLES
ALTER TABLE public.himas_appointments 
ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS followup_date DATE,
ADD COLUMN IF NOT EXISTS surgery_date DATE,
ADD COLUMN IF NOT EXISTS surgery_lost_date DATE,
ADD COLUMN IF NOT EXISTS completed_surgery DATE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS remarks TEXT;

-- 2. AUTO-UPDATE TRIGGER FUNCTION FOR 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_himas_appointments_updated_at ON public.himas_appointments;
CREATE TRIGGER update_himas_appointments_updated_at
BEFORE UPDATE ON public.himas_appointments
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- 3. FULL TABLE DEFINITION
CREATE TABLE IF NOT EXISTS public.himas_appointments (
    id TEXT PRIMARY KEY,
    hospital_id TEXT DEFAULT 'himas_facility_01',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    status_updated_at TIMESTAMPTZ, -- Tracks when the status moved from Pending
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    occupation TEXT,
    dob DATE,
    source TEXT,
    source_doctor_name TEXT,
    condition TEXT,
    has_insurance TEXT DEFAULT 'No',
    insurance_name TEXT,
    entry_date DATE,
    booking_time TIME,
    arrival_time TIME,
    booking_status TEXT DEFAULT 'Scheduled', 
    is_follow_up BOOLEAN DEFAULT FALSE,
    
    remarks TEXT,
    follow_up_date DATE,
    followup_date DATE,
    surgery_date DATE,
    surgery_lost_date DATE,
    completed_surgery DATE,
    
    doctor_assessment JSONB,
    package_proposal JSONB
);

CREATE INDEX IF NOT EXISTS idx_himas_status_updated_at ON public.himas_appointments (status_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_himas_updated_at ON public.himas_appointments (updated_at DESC);

-- Staff Users Table
CREATE TABLE IF NOT EXISTS public.staff_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    mobile TEXT,
    role TEXT,
    password TEXT,
    registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS CONFIGURATION
ALTER TABLE public.himas_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow Public Access on Appointments" ON public.himas_appointments;
DROP POLICY IF EXISTS "Allow Public Access on Staff" ON public.staff_users;

CREATE POLICY "Allow Public Access on Appointments" 
ON public.himas_appointments FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow Public Access on Staff" 
ON public.staff_users FOR ALL TO public USING (true) WITH CHECK (true);