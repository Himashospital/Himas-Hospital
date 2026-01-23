-- Main consolidated table for all patient and appointment data
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
    
    -- Stores all data from the Package & Counseling Team
    package_proposal JSONB,

    -- Doctor's assessment as a structured JSON object
    doctor_assessment JSONB
);

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

-- Insert default demo users for login
INSERT INTO public.staff_users (id, name, email, role, password)
VALUES 
('demo-1', 'Front Office', 'office@himas.com', 'FRONT_OFFICE', 'Himas1984@'),
('demo-2', 'Surgeon', 'doctor@himas.com', 'DOCTOR', 'Doctor8419@'),
('demo-3', 'Package Admin', 'team@himas.com', 'PACKAGE_TEAM', 'Team8131@')
ON CONFLICT (email) DO NOTHING;

-- Enable Row Level Security (RLS) for the tables
ALTER TABLE public.himas_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

-- Create broad policies to allow access (as per original app structure)
CREATE POLICY "Allow All Access on Appointments" ON public.himas_appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access on Staff" ON public.staff_users FOR ALL USING (true) WITH CHECK (true);


-- =================================================================
-- SAMPLE DATA FOR 'himas_appointments'
-- This section seeds the database with realistic patient data
-- covering various stages of the patient journey.
-- =================================================================

INSERT INTO public.himas_appointments (id, name, mobile, age, gender, occupation, source, condition, has_insurance, entry_date, booking_status, booking_time, doctor_assessment, package_proposal)
VALUES
    -- 1. Scheduled Appointment (Lead for Front Office)
    ('APP-XYZ78', 'Priya Sharma', '9876543211', 34, 'Female', 'Marketing Manager', 'Google', 'Gallstones', 'Yes', CURRENT_DATE, 'Scheduled', '10:30:00', NULL, NULL),

    -- 2. Arrived Patient, waiting for Doctor
    ('HMS-001', 'Amit Patel', '9876543212', 45, 'Male', 'Engineer', 'Website', 'Hernia', 'Yes', CURRENT_DATE - 1, 'Arrived', '09:00:00', NULL, NULL),

    -- 3. Assessed by Doctor -> Medication Only
    ('HMS-002', 'Sunita Gupta', '9876543213', 52, 'Female', 'Teacher', 'Old Patient / Relatives', 'Fissure', 'No', CURRENT_DATE - 2, 'Arrived', '11:00:00',
    '{
      "notes": "Prescribed stool softeners and topical cream. Advised dietary changes. Follow-up in 2 weeks.",
      "quickCode": "M1 - Medication Only",
      "assessedAt": "2024-07-28T11:30:00Z",
      "painSeverity": "Moderate",
      "doctorSignature": "Dr. Verma"
    }', NULL),

    -- 4. Assessed by Doctor -> Surgery Recommended (Pending Counseling)
    ('HMS-003', 'Rohan Singh', '9876543214', 28, 'Male', 'Software Developer', 'Friends / Online', 'Piles', 'Yes', CURRENT_DATE - 2, 'Arrived', '12:00:00',
    '{
      "notes": "Grade 3 internal hemorrhoids. Patient experiencing significant discomfort. Laser hemorrhoidectomy recommended.",
      "quickCode": "S1 - Surgery Recommended",
      "assessedAt": "2024-07-28T12:45:00Z",
      "painSeverity": "High",
      "affordability": "A2 - Mid",
      "conversionReadiness": "CR2 - Needs Push",
      "tentativeSurgeryDate": "2024-08-10",
      "doctorSignature": "Dr. Verma"
    }', NULL),

    -- 5. Counseled by Package Team -> Surgery Scheduled
    ('HMS-004', 'Anjali Desai', '9876543215', 38, 'Female', 'Accountant', 'Doctor Recommend', 'Gallstones', 'Yes', CURRENT_DATE - 3, 'Arrived', '10:00:00',
    '{
      "notes": "Multiple gallstones found on ultrasound. Laparoscopic cholecystectomy advised.",
      "quickCode": "S1 - Surgery Recommended",
      "assessedAt": "2024-07-27T10:45:00Z",
      "painSeverity": "High",
      "affordability": "A3 - Premium",
      "conversionReadiness": "CR1 - Ready",
      "doctorSignature": "Dr. Mehta"
    }',
    '{
      "status": "Surgery Fixed",
      "paymentMode": "Insurance Approved",
      "outcomeDate": "2024-08-05",
      "roomType": "Private",
      "stayDays": 2,
      "icuCharges": "Excluded",
      "packageAmount": 95000,
      "preOpInvestigation": "Included",
      "surgeryMedicines": "Included",
      "equipment": ["Included"],
      "counselingStrategy": "Patient was well-informed and ready. Focused on insurance process and post-op care.",
      "proposalCreatedAt": "2024-07-27T14:00:00Z"
    }'),

    -- 6. Counseled by Package Team -> Follow-Up
    ('HMS-005', 'Vikram Kumar', '9876543216', 60, 'Male', 'Retired', 'Website', 'Hernia', 'No', CURRENT_DATE - 4, 'Arrived', '14:00:00',
    '{
      "notes": "Inguinal hernia, requires mesh repair surgery.",
      "quickCode": "S1 - Surgery Recommended",
      "assessedAt": "2024-07-26T14:30:00Z",
      "painSeverity": "Moderate",
      "affordability": "A1 - Basic",
      "conversionReadiness": "CR3 - Needs Counseling",
      "doctorSignature": "Dr. Verma"
    }',
    '{
      "status": "Follow-Up",
      "paymentMode": "Cash",
      "followUpDate": "2024-08-02",
      "objectionIdentified": "Concerned about the cost and wants to discuss with family.",
      "counselingStrategy": "Explained the benefits and provided a basic package estimate. Scheduled a call with his son.",
      "proposalCreatedAt": "2024-07-26T16:00:00Z"
    }'),

    -- 7. Counseled by Package Team -> Lost
    ('HMS-006', 'Meena Iyer', '9876543217', 41, 'Female', 'Homemaker', 'Facebook', 'Varicose Veins', 'Yes', CURRENT_DATE - 5, 'Arrived', '15:00:00',
    '{
      "notes": "Significant varicose veins in both legs. EVLT procedure recommended for treatment.",
      "quickCode": "S1 - Surgery Recommended",
      "assessedAt": "2024-07-25T15:30:00Z",
      "painSeverity": "Moderate",
      "affordability": "A2 - Mid",
      "conversionReadiness": "CR4 - Not Ready",
      "doctorSignature": "Dr. Mehta"
    }',
    '{
      "status": "Lost",
      "lostReason": "Fear of Surgery",
      "objectionIdentified": "Patient is afraid of anesthesia and potential scarring.",
      "counselingStrategy": "AI strategy was used to explain the minimally invasive nature, but patient anxiety was too high.",
      "proposalCreatedAt": "2024-07-25T17:00:00Z"
    }'),

    -- 8. Another Arrived Patient, waiting for Doctor
    ('HMS-007', 'Rajesh Nair', '9876543218', 33, 'Male', 'IT Consultant', 'Google', 'Fistula', 'Not Sure', CURRENT_DATE - 1, 'Arrived', '16:00:00', NULL, NULL),
    
    -- 9. Another Scheduled Appointment (Lead for Front Office)
    ('APP-QWE12', 'Fatima Khan', '9876543219', 29, 'Female', 'Graphic Designer', 'Instagram', 'Appendix', 'Yes', CURRENT_DATE, 'Scheduled', '14:00:00', NULL, NULL)

ON CONFLICT (id) DO NOTHING;

-- =================================================================
-- DATABASE TRIGGER FOR DATA INTEGRITY
-- Automatically trims whitespace from the 'id' column before insert
-- to prevent issues with user input errors.
-- =================================================================
CREATE OR REPLACE FUNCTION trim_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    NEW.id = TRIM(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists to ensure idempotency
DROP TRIGGER IF EXISTS before_insert_himas_appointments_trim_id ON public.himas_appointments;

-- Create the trigger
CREATE TRIGGER before_insert_himas_appointments_trim_id
BEFORE INSERT ON public.himas_appointments
FOR EACH ROW
EXECUTE FUNCTION trim_id_on_insert();
