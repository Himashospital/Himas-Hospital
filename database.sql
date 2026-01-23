-- Consolidated Table Schema based on user image
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
    doctor_assessment JSONB,
    package_proposal JSONB,
    is_follow_up BOOLEAN DEFAULT FALSE,
    last_follow_up_visit_date DATE,
    booking_status TEXT DEFAULT 'Scheduled',
    booking_time TIME,
    arrival_time TIME,
    follow_up_control TEXT,
    clinical_findings_notes TEXT,
    digital_signature TEXT
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

CREATE POLICY "Allow All" ON public.himas_appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.staff_users FOR ALL USING (true) WITH CHECK (true);