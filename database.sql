-- Consolidated table for Himas Hospital Management System
-- This table tracks the complete patient lifecycle from Front Office to Package Counseling

CREATE TABLE IF NOT EXISTS himas_appointments (
    -- ==========================================
    -- 1. FRONT OFFICE FIELDS
    -- ==========================================
    id VARCHAR(255) PRIMARY KEY,               -- Case/File Number (e.g., HMS-001)
    hospital_id VARCHAR(255) NOT NULL DEFAULT 'himas_facility_01',
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(20),
    mobile VARCHAR(50) NOT NULL,
    occupation VARCHAR(255),
    source VARCHAR(100),                       -- Marketing Source
    patient_condition VARCHAR(100),            -- Complaint/Condition
    booking_type VARCHAR(50) DEFAULT 'OPD',    -- OPD or Follow Up
    appointment_date DATE,                     -- Date of visit
    appointment_time TIME,                     -- Time of visit
    status VARCHAR(50) DEFAULT 'Scheduled',    -- Arrival Status
    has_insurance VARCHAR(20) DEFAULT 'No',
    insurance_name VARCHAR(255),

    -- ==========================================
    -- 2. DOCTOR COUNSELING FIELDS
    -- ==========================================
    doctor_counseling_status VARCHAR(100),     -- (Requested: Doctor Counseling Status)
    pain_severity VARCHAR(50),                 -- (Requested: Pain Severity)
    clinical_findings_notes TEXT,              -- (Requested: Clinical Findings & Notes)
    affordability VARCHAR(50),                 -- (Requested: Affordability)
    readiness VARCHAR(50),                     -- (Requested: Readiness)
    doctor_signature VARCHAR(255),             -- Evaluating Surgeon Name
    assessed_at DATETIME,                      -- Timestamp of clinical completion

    -- ==========================================
    -- 3. COUNSELING PACKAGE & FINANCIALS
    -- ==========================================
    package_status VARCHAR(50),                -- (Requested: Counseling Package Status)
    mode_of_payment VARCHAR(100),              -- (Requested: Mode of Payment)
    package_amount VARCHAR(100),               -- (Requested: Package Amount ₹)
    inclusions TEXT,                           -- (Requested: Inclusions)
    room_type VARCHAR(50),                     -- (Requested: Room Type)
    counseling_outcome_date DATE,              -- (Requested: Set Counseling Outcome date)
    lost_reason TEXT,                          -- Reason if lead is marked Lost
    counseling_strategy TEXT,                  -- AI-generated strategy notes
    
    -- METADATA
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- PERFORMANCE INDEXES
CREATE INDEX idx_himas_mobile ON himas_appointments(mobile);
CREATE INDEX idx_himas_date ON himas_appointments(appointment_date);
CREATE INDEX idx_himas_readiness ON himas_appointments(readiness);
CREATE INDEX idx_himas_pkg_status ON himas_appointments(package_status);