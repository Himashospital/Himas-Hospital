
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient, DoctorAssessment, PackageProposal, Role, StaffUser, Appointment, Condition, SurgeonCode, PainSeverity, Affordability, ConversionReadiness, ProposalOutcome, Gender } from '../types';
import { supabase } from '../services/supabaseClient';

interface PatientFilters {
  startDate?: string;
  endDate?: string;
  condition?: string;
  source?: string;
  hasInsurance?: string;
  surgeryNeeded?: boolean;
  medicationOnly?: boolean;
  status?: 'New' | 'Consulted' | 'Counseled';
  searchTerm?: string;
}

interface HospitalContextType {
  currentUserRole: Role;
  setCurrentUserRole: (role: Role) => void;
  patients: Patient[];
  addPatient: (patientData: Omit<Patient, 'registeredAt' | 'hospital_id'>) => Promise<void>; 
  updatePatient: (targetId: string, patient: Patient) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  updateDoctorAssessment: (patientId: string, assessment: DoctorAssessment) => Promise<void>;
  updatePackageProposal: (patientId: string, proposal: PackageProposal) => Promise<void>;
  getPatientById: (id: string) => Patient | undefined;
  fetchFilteredPatients: (filters: PatientFilters, page: number, pageSize: number) => Promise<{ data: Patient[], count: number }>;
  appointments: Appointment[];
  addAppointment: (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'hospital_id' | 'status'>) => Promise<void>;
  updateAppointment: (appointment: Appointment) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  staffUsers: StaffUser[];
  registerStaff: (staffData: Omit<StaffUser, 'id' | 'registeredAt'>) => void;
  saveStatus: 'saved' | 'saving' | 'error' | 'unsaved';
  lastSavedAt: Date | null;
  refreshData: () => Promise<void>;
  isLoading: boolean;
  isStaffLoaded: boolean;
}

const HospitalContext = createContext<HospitalContextType | undefined>(undefined);
const STORAGE_KEY_ROLE = 'himas_hospital_role';

// Helper: Map himas_data (JSONB style) to Patient interface
const mapHimasDataToPatient = (row: any): Patient => ({
  id: row.id || '',
  hospital_id: row.hospital_id || '',
  name: row.full_name || '',
  dob: row.dob || '',
  gender: (row.gender || Gender.Other) as Gender,
  age: row.age || 0,
  mobile: row.mobile_number || '',
  occupation: row.occupation || '',
  hasInsurance: row.has_insurance || 'No',
  insuranceName: row.insurance_name || '',
  source: row.source || 'Other',
  condition: (row.condition || Condition.Other) as Condition,
  visitType: row.visit_type || 'OPD',
  registeredAt: row.created_at || new Date().toISOString(),
  entry_date: row.entry_date || (row.created_at ? row.created_at.split('T')[0] : ''),
  doctorAssessment: row.doctor_assessment,
  packageProposal: row.package_proposal,
  sourceTable: 'himas_data'
});

// Helper: Map himas_appointments (Flat style) to Patient interface
const mapHimasApptToPatient = (row: any): Patient => ({
  id: row.id || '',
  hospital_id: row.hospital_id || '',
  name: row.name || '',
  gender: (row.gender || Gender.Other) as Gender,
  age: row.age || 0,
  mobile: row.mobile || '',
  occupation: row.occupation || '',
  hasInsurance: row.has_insurance || 'No',
  insuranceName: row.insurance_name || '',
  source: row.source || 'Other',
  condition: (row.patient_condition || Condition.Other) as Condition,
  visitType: row.booking_type || 'OPD',
  registeredAt: row.created_at || new Date().toISOString(),
  entry_date: row.appointment_date || '',
  sourceTable: 'himas_appointments',
  doctorAssessment: row.doctor_signature ? {
    quickCode: row.doctor_counseling_status as SurgeonCode,
    painSeverity: row.pain_severity as PainSeverity,
    affordability: row.affordability as Affordability,
    conversionReadiness: row.readiness as ConversionReadiness,
    doctorSignature: row.doctor_signature,
    assessedAt: row.assessed_at,
    doctorNote: row.clinical_findings_notes,
    tentativeSurgeryDate: ''
  } : undefined,
  packageProposal: row.package_status ? {
    outcome: row.package_status as ProposalOutcome,
    modeOfPayment: row.mode_of_payment,
    packageAmount: row.package_amount,
    roomType: row.room_type,
    outcomeDate: row.counseling_outcome_date,
    lostReason: row.lost_reason,
    counselingStrategy: row.counseling_strategy,
    proposalCreatedAt: row.created_at,
    decisionPattern: '',
    objectionIdentified: '',
    followUpDate: ''
  } : undefined
});

export const HospitalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUserRole, setCurrentUserRoleState] = useState<Role>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'unsaved'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStaffLoaded, setIsStaffLoaded] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem(STORAGE_KEY_ROLE);
    if (savedRole) setCurrentUserRoleState(savedRole as Role);
    refreshData();
  }, []);

  const setCurrentUserRole = (role: Role) => {
    setCurrentUserRoleState(role);
    if (role) localStorage.setItem(STORAGE_KEY_ROLE, role);
    else localStorage.removeItem(STORAGE_KEY_ROLE);
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      // Helper function to handle table fetch errors
      const safeFetch = async (tableName: string) => {
        const { data, error } = await supabase.from(tableName).select('*');
        if (error) {
          // 42P01 is Postgres code for "undefined_table"
          if (error.code === '42P01') {
            console.warn(`Table ${tableName} does not exist yet. Please run database.sql.`);
            return [];
          }
          throw error;
        }
        return data || [];
      };

      // 1. Fetch from himas_data (JSONB)
      const dataRows = await safeFetch('himas_data');
      const patientsFromData = dataRows.map(mapHimasDataToPatient);

      // 2. Fetch from himas_appointments (Flat)
      const apptRows = await safeFetch('himas_appointments');
      const patientsFromAppts = apptRows.map(mapHimasApptToPatient);

      // 3. Combine both sources for a unified view
      setPatients([...patientsFromData, ...patientsFromAppts]);

      // Handle standard appointments list for scheduling view (only Scheduled status)
      const apptsOnly = apptRows
        .filter((r: any) => r.status === 'Scheduled')
        .map((r: any) => ({
          id: r.id || '',
          hospital_id: r.hospital_id || '',
          name: r.name || '',
          source: r.source || '',
          condition: (r.patient_condition || Condition.Other) as Condition,
          mobile: r.mobile || '',
          date: r.appointment_date || '',
          time: r.appointment_time || '',
          status: (r.status || 'Scheduled') as any,
          bookingType: (r.booking_type || 'OPD') as any,
          createdAt: r.created_at || new Date().toISOString()
        }));
      setAppointments(apptsOnly);

      // 4. Staff
      const staffData = await safeFetch('staff_users');
      setStaffUsers(staffData);
      setIsStaffLoaded(true);

      setSaveStatus('saved');
      setLastSavedAt(new Date());
    } catch (err) {
      console.error('Refresh Error:', err);
      setSaveStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const addPatient = async (patientData: Omit<Patient, 'registeredAt' | 'hospital_id'>) => {
    setSaveStatus('saving');
    try {
      const dbRecord = {
        id: patientData.id,
        full_name: patientData.name,
        dob: patientData.dob,
        gender: patientData.gender,
        age: patientData.age,
        mobile_number: patientData.mobile,
        occupation: patientData.occupation,
        source: patientData.source,
        condition: patientData.condition,
        visit_type: patientData.visitType,
        has_insurance: patientData.hasInsurance,
        insurance_name: patientData.insuranceName,
        entry_date: new Date().toISOString().split('T')[0]
      };
      
      const { error } = await supabase.from('himas_data').insert(dbRecord);
      if (error) throw error;
      
      await refreshData();
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
      console.error(err);
    }
  };

  const updatePatient = async (targetId: string, patient: Patient) => {
    setSaveStatus('saving');
    try {
      const isFromAppts = patient.sourceTable === 'himas_appointments';
      
      if (isFromAppts) {
        const updateData = {
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          mobile: patient.mobile,
          patient_condition: patient.condition,
          booking_type: patient.visitType,
          has_insurance: patient.hasInsurance,
          insurance_name: patient.insuranceName,
          doctor_counseling_status: patient.doctorAssessment?.quickCode,
          pain_severity: patient.doctorAssessment?.painSeverity,
          clinical_findings_notes: patient.doctorAssessment?.doctorNote,
          affordability: patient.doctorAssessment?.affordability,
          readiness: patient.doctorAssessment?.conversionReadiness,
          doctor_signature: patient.doctorAssessment?.doctorSignature,
          assessed_at: patient.doctorAssessment?.assessedAt,
          package_status: patient.packageProposal?.outcome,
          mode_of_payment: patient.packageProposal?.modeOfPayment,
          package_amount: patient.packageProposal?.packageAmount,
          room_type: patient.packageProposal?.roomType,
          counseling_outcome_date: patient.packageProposal?.outcomeDate,
          lost_reason: patient.packageProposal?.lostReason,
          counseling_strategy: patient.packageProposal?.counselingStrategy
        };
        const { error } = await supabase.from('himas_appointments').update(updateData).eq('id', targetId);
        if (error) throw error;
      } else {
        const updateData = {
          full_name: patient.name,
          dob: patient.dob,
          gender: patient.gender,
          age: patient.age,
          mobile_number: patient.mobile,
          occupation: patient.occupation,
          source: patient.source,
          condition: patient.condition,
          visit_type: patient.visitType,
          has_insurance: patient.hasInsurance,
          insurance_name: patient.insuranceName,
          doctor_assessment: patient.doctorAssessment,
          package_proposal: patient.packageProposal
        };
        const { error } = await supabase.from('himas_data').update(updateData).eq('id', targetId);
        if (error) throw error;
      }
      
      setPatients(prev => prev.map(p => p.id === targetId ? { ...patient } : p));
      setSaveStatus('saved');
      setLastSavedAt(new Date());
    } catch (err) {
      setSaveStatus('error');
      console.error(err);
    }
  };

  const deletePatient = async (id: string) => {
    setSaveStatus('saving');
    try {
      const patient = patients.find(p => p.id === id);
      const table = patient?.sourceTable === 'himas_appointments' ? 'himas_appointments' : 'himas_data';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      setPatients(prev => prev.filter(p => p.id !== id));
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const updateDoctorAssessment = async (patientId: string, assessment: DoctorAssessment) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) await updatePatient(patientId, { ...patient, doctorAssessment: assessment });
  };

  const updatePackageProposal = async (patientId: string, proposal: PackageProposal) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) await updatePatient(patientId, { ...patient, packageProposal: proposal });
  };

  const getPatientById = (id: string) => patients.find(p => p.id === id);

  const fetchFilteredPatients = async (filters: PatientFilters, page: number, pageSize: number) => {
    return { data: patients, count: patients.length };
  };

  const addAppointment = async (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'hospital_id' | 'status'>) => {
    setSaveStatus('saving');
    try {
      const dbRecord = {
        id: `APP-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        name: appointmentData.name,
        mobile: appointmentData.mobile,
        source: appointmentData.source,
        patient_condition: appointmentData.condition,
        appointment_date: appointmentData.date,
        appointment_time: appointmentData.time,
        booking_type: appointmentData.bookingType,
        status: 'Scheduled'
      };
      const { error } = await supabase.from('himas_appointments').insert(dbRecord);
      if (error) throw error;
      await refreshData();
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const updateAppointment = async (appointment: Appointment) => {
    setSaveStatus('saving');
    try {
      const updateData = {
        appointment_date: appointment.date,
        appointment_time: appointment.time,
        status: appointment.status,
        booking_type: appointment.bookingType
      };
      const { error } = await supabase.from('himas_appointments').update(updateData).eq('id', appointment.id);
      if (error) throw error;
      await refreshData();
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const deleteAppointment = async (id: string) => {
    setSaveStatus('saving');
    try {
      const { error } = await supabase.from('himas_appointments').delete().eq('id', id);
      if (error) throw error;
      await refreshData();
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const registerStaff = async (staffData: Omit<StaffUser, 'id' | 'registeredAt'>) => {
    setSaveStatus('saving');
    try {
      const newStaff = { ...staffData, id: Math.random().toString(36).substr(2, 9), registeredAt: new Date().toISOString() };
      const { error } = await supabase.from('staff_users').insert(newStaff);
      if (error) throw error;
      setStaffUsers(prev => [...prev, newStaff as StaffUser]);
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
    }
  };

  return (
    <HospitalContext.Provider value={{
      currentUserRole, setCurrentUserRole,
      patients, addPatient, updatePatient, deletePatient,
      updateDoctorAssessment, updatePackageProposal,
      getPatientById, fetchFilteredPatients,
      appointments, addAppointment, updateAppointment, deleteAppointment,
      staffUsers, registerStaff,
      saveStatus, lastSavedAt, refreshData, isLoading, isStaffLoaded
    }}>
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = () => {
  const context = useContext(HospitalContext);
  if (context === undefined) throw new Error('useHospital must be used within a HospitalProvider');
  return context;
};
