-- =================================================================
-- HIMAS HOSPITAL MANAGEMENT DATABASE SCHEMA
-- Version: 2.1 (Added Native Follow-Up Column)
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

-- Migration logic: If you are updating an existing table, run these:
-- ALTER TABLE public.himas_appointments ADD COLUMN IF NOT EXISTS follow_up_date DATE;
-- UPDATE public.himas_appointments SET follow_up_date = (package_proposal->>'followUpDate')::DATE WHERE package_proposal->>'followUpDate' IS NOT NULL;

-- Staff Users Table for managing application access
CREATE TABLE IF NOT EXISTS public.staff_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    mobile TEXT,
    role TEXT,
    password TEXT,
    registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default demo users
INSERT INTO public.staff_users (id, name, email, role, password)
VALUES 
('demo-1', 'Front Office', 'office@himas.com', 'FRONT_OFFICE', 'Himas1984@'),
('demo-2', 'Surgeon', 'doctor@himas.com', 'DOCTOR', 'Doctor8419@'),
('demo-3', 'Package Admin', 'team@himas.com', 'PACKAGE_TEAM', 'Team8131@')
ON CONFLICT (email) DO NOTHING;

-- RLS CONFIGURATION
ALTER TABLE public.himas_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow Public Access on Appointments" ON public.himas_appointments;
DROP POLICY IF EXISTS "Allow Public Access on Staff" ON public.staff_users;

CREATE POLICY "Allow Public Access on Appointments" 
ON public.himas_appointments 
FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow Public Access on Staff" 
ON public.staff_users 
FOR ALL TO public USING (true) WITH CHECK (true);

-- SAMPLE DATA
INSERT INTO public.himas_appointments (id, name, mobile, age, gender, condition, entry_date, booking_status, follow_up_date, package_proposal)
VALUES
    ('HMS-006', 'Vikram Kumar', '9876543216', 60, 'Male', 'Hernia', CURRENT_DATE - 4, 'Arrived', '2024-08-02', 
    '{
      "status": "Follow-Up",
      "paymentMode": "Cash",
      "objectionIdentified": "Concerned about cost.",
      "counselingStrategy": "Explained benefits.",
      "proposalCreatedAt": "2024-07-26T16:00:00Z"
    }')
ON CONFLICT (id) DO NOTHING;

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
FOR EACH ROW
EXECUTE FUNCTION trim_id_on_insert();