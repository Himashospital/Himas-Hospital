-- =================================================================
-- HIMAS HOSPITAL MANAGEMENT DATABASE SCHEMA
-- Version: 2.2 (Native Follow-Up Column Support)
-- =================================================================

-- Single consolidated table for all patient and appointment data.
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
    
    -- Native Follow-Up Column for optimized sorting and querying
    follow_up_date DATE,
    
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

DROP POLICY IF EXISTS "Allow Public Access on Appointments" ON public.himas_appointments;
DROP POLICY IF EXISTS "Allow Public Access on Staff" ON public.staff_users;

CREATE POLICY "Allow Public Access on Appointments" 
ON public.himas_appointments FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow Public Access on Staff" 
ON public.staff_users FOR ALL TO public USING (true) WITH CHECK (true);

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