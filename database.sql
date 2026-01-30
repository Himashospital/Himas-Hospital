
-- =================================================================
-- HIMAS HOSPITAL MANAGEMENT DATABASE SCHEMA
-- Version: 2.8 (Strict Counseling Notes Support)
-- =================================================================

-- 1. MIGRATION SCRIPT FOR EXISTING TABLES (Run this in your SQL Editor):
ALTER TABLE public.himas_appointments 
ADD COLUMN IF NOT EXISTS followup_date DATE,
ADD COLUMN IF NOT EXISTS surgery_date DATE,
ADD COLUMN IF NOT EXISTS surgery_lost_date DATE,
ADD COLUMN IF NOT EXISTS completed_surgery DATE,
ADD COLUMN IF NOT EXISTS remarks TEXT; -- Native column for strict reference notes

-- 2. CREATE COUNSELING RECORDS SUB-TABLE (If you prefer a separate table):
CREATE TABLE IF NOT EXISTS public.counseling_records (
    patient_id TEXT PRIMARY KEY REFERENCES public.himas_appointments(id) ON DELETE CASCADE,
    surgery_date DATE,
    followup_date DATE,
    surgery_lost_date DATE,
    completed_surgery DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. FULL TABLE DEFINITION (For reference or new setups):
CREATE TABLE IF NOT EXISTS public.himas_appointments (
    id TEXT PRIMARY KEY,
    hospital_id TEXT DEFAULT 'himas_facility_01',
    created_at TIMESTAMPTZ DEFAULT NOW(),
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
    
    -- Native tracking columns for counseling and outcomes
    remarks TEXT,              -- Strict reference counseling notes
    follow_up_date DATE,       -- Primary follow-up column used by the app
    followup_date DATE,        -- Dedicated counseling follow-up date
    surgery_date DATE,         -- Scheduled/Performed surgery date
    surgery_lost_date DATE,    -- Date lead was marked as lost
    completed_surgery DATE,    -- Date surgery was completed
    
    -- Structured JSON objects for complex assessment data
    doctor_assessment JSONB,
    package_proposal JSONB
);

-- Index for the Follow-Up section sorting
CREATE INDEX IF NOT EXISTS idx_himas_follow_up_date ON public.himas_appointments (follow_up_date ASC);

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
ALTER TABLE public.counseling_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow Public Access on Appointments" ON public.himas_appointments;
DROP POLICY IF EXISTS "Allow Public Access on Staff" ON public.staff_users;
DROP POLICY IF EXISTS "Allow Public Access on Counseling Records" ON public.counseling_records;

CREATE POLICY "Allow Public Access on Appointments" 
ON public.himas_appointments FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow Public Access on Staff" 
ON public.staff_users FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow Public Access on Counseling Records" 
ON public.counseling_records FOR ALL TO public USING (true) WITH CHECK (true);

-- ID Trimming Trigger
CREATE OR REPLACE FUNCTION trim_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    NEW.id = TRIM(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_insert_himas_appointments_trim_id ON public.himas_appointments;
CREATE TRIGGER before_insert_himas_appointments_trim_id
BEFORE INSERT ON public.himas_appointments
FOR EACH ROW EXECUTE FUNCTION trim_id_on_insert();
