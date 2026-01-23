-- Main table for patient registrations and appointments
CREATE TABLE IF NOT EXISTS public.himas_appointments (
    id TEXT PRIMARY KEY,
    hospital_id TEXT DEFAULT 'himas_facility_01',
    name TEXT NOT NULL,
    dob DATE,
    entry_date DATE,
    gender TEXT,
    age INTEGER,
    mobile TEXT NOT NULL,
    occupation TEXT,
    has_insurance TEXT DEFAULT 'No',
    insurance_name TEXT,
    source TEXT,
    source_doctor_name TEXT,
    condition TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    package_proposal JSONB,
    is_follow_up BOOLEAN DEFAULT FALSE,
    last_follow_up_visit_date DATE,
    booking_status TEXT DEFAULT 'Scheduled',
    booking_time TIME,
    arrival_time TIME,
    follow_up_control TEXT
);

-- New dedicated table for doctor assessments
CREATE TABLE IF NOT EXISTS public.doctor_assessment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT NOT NULL UNIQUE,
    notes TEXT,
    quick_code TEXT,
    assessed_at TIMESTAMPTZ DEFAULT NOW(),
    pain_severity TEXT,
    affordability TEXT,
    doctor_signature TEXT,
    other_surgery_name TEXT,
    conversion_readiness TEXT,
    tentative_surgery_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_patient
      FOREIGN KEY(patient_id) 
      REFERENCES himas_appointments(id)
      ON DELETE CASCADE
);


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

-- Default Demo Users
INSERT INTO public.staff_users (id, name, email, role, password)
VALUES 
('demo-1', 'Front Office', 'office@himas.com', 'FRONT_OFFICE', 'Himas1984@'),
('demo-2', 'Surgeon', 'doctor@himas.com', 'DOCTOR', 'Doctor8419@'),
('demo-3', 'Package Admin', 'team@himas.com', 'PACKAGE_TEAM', 'Team8131@')
ON CONFLICT (email) DO NOTHING;

-- RLS Policies
ALTER TABLE public.himas_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_assessment ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Allow All" ON public.himas_appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.staff_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.doctor_assessment FOR ALL USING (true) WITH CHECK (true);