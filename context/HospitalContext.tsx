
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
  updateDoctorAssessment: (patientId: string, assessment: Partial<DoctorAssessment>) => Promise<void>;
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

const cleanObject = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanObject);
  
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, cleanObject(v === '....' ? null : v)])
  );
};

const nullify = (val: any) => {
  if (val === undefined || val === null) return null;
  if (typeof val === 'string' && val.trim() === '') return null;
  if (val === '....') return null;
  return val;
};

const mapRowToPatient = (row: any): Patient => ({
  id: row.id || '',
  hospital_id: row.hospital_id || '',
  name: row.name || '',
  dob: row.dob || '',
  gender: (row.gender || Gender.Other) as Gender,
  age: row.age || 0,
  mobile: row.mobile || '',
  occupation: row.occupation || '',
  hasInsurance: row.has_insurance || 'No',
  insuranceName: row.insurance_name || '',
  source: row.source || 'Other',
  sourceDoctorName: row.source_doctor_name || '',
  condition: (row.condition || Condition.Other) as Condition,
  visitType: row.is_follow_up ? 'Follow Up' : 'OPD',
  registeredAt: row.created_at || new Date().toISOString(),
  entry_date: row.entry_date || '',
  status: row.booking_status || 'Scheduled',
  packageProposal: row.package_proposal,
  sourceTable: 'himas_appointments'
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
      const [
        { data: apptRows, error: apptError },
        { data: assessmentRows, error: assessmentError },
        { data: staffData }
      ] = await Promise.all([
        supabase.from('himas_appointments').select('*').order('created_at', { ascending: false }),
        supabase.from('doctor_assessment').select('*'),
        supabase.from('staff_users').select('*')
      ]);

      if (apptError) throw apptError;
      if (assessmentError) throw assessmentError;

      const assessmentMap = new Map<string, DoctorAssessment>();
      (assessmentRows || []).forEach(asm => {
        assessmentMap.set(asm.patient_id, asm as DoctorAssessment);
      });

      // Part 1: "Arrived" records go to patients list (OPD History)
      const patientRecords = (apptRows || [])
        .filter(row => row.booking_status === 'Arrived')
        .map(row => {
          const patient = mapRowToPatient(row);
          patient.doctorAssessment = assessmentMap.get(patient.id);
          return patient;
        });
      setPatients(patientRecords);

      // Part 2: "Scheduled" records go to appointments list (Scheduled Appointments)
      const scheduledOnly = (apptRows || [])
        .filter(row => row.booking_status === 'Scheduled' || !row.booking_status)
        .map(row => ({
          id: row.id || '',
          hospital_id: row.hospital_id || '',
          name: row.name || '',
          source: row.source || '',
          condition: (row.condition || Condition.Other) as Condition,
          mobile: row.mobile || '',
          date: row.entry_date || '',
          time: row.booking_time || '',
          status: 'Scheduled',
          bookingType: row.is_follow_up ? 'Follow Up' : 'OPD',
          createdAt: row.created_at || new Date().toISOString()
        }));
      setAppointments(scheduledOnly as Appointment[]);

      if (staffData) {
        setStaffUsers(staffData);
        setIsStaffLoaded(true);
      }
      setSaveStatus('saved');
    } catch (err) {
      console.error('[Hospital] Global Sync Failure:', err);
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
        name: patientData.name,
        dob: nullify(patientData.dob),
        gender: patientData.gender,
        age: patientData.age,
        mobile: patientData.mobile,
        occupation: patientData.occupation,
        source: patientData.source,
        source_doctor_name: patientData.sourceDoctorName,
        condition: patientData.condition,
        is_follow_up: patientData.visitType === 'Follow Up',
        has_insurance: patientData.hasInsurance,
        insurance_name: patientData.insuranceName,
        booking_status: 'Arrived',
        entry_date: new Date().toISOString().split('T')[0],
        arrival_time: new Date().toTimeString().split(' ')[0],
        hospital_id: 'himas_facility_01'
      };
      
      const { error } = await supabase.from('himas_appointments').insert(dbRecord);
      if (error) throw error;
      await refreshData();
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const updatePatient = async (targetId: string, patient: Patient) => {
    setSaveStatus('saving');
    try {
      const updateData = {
        id: patient.id,
        name: patient.name,
        dob: nullify(patient.dob),
        age: patient.age,
        gender: patient.gender,
        mobile: patient.mobile,
        occupation: patient.occupation,
        condition: patient.condition,
        is_follow_up: patient.visitType === 'Follow Up',
        has_insurance: patient.hasInsurance,
        insurance_name: patient.insuranceName,
        source_doctor_name: patient.sourceDoctorName,
        entry_date: patient.entry_date || (patient.status === 'Arrived' ? new Date().toISOString().split('T')[0] : null),
        booking_status: patient.status || 'Scheduled',
        package_proposal: cleanObject(patient.packageProposal),
      };
      
      const { error } = await supabase.from('himas_appointments').update(updateData).eq('id', targetId);
      if (error) throw error;
      await refreshData();
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const deletePatient = async (id: string) => {
    setSaveStatus('saving');
    try {
      const { error } = await supabase.from('himas_appointments').delete().eq('id', id);
      if (error) throw error;
      await refreshData();
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const updateDoctorAssessment = async (patientId: string, assessmentData: Partial<DoctorAssessment>) => {
    setSaveStatus('saving');
    try {
        const payload = cleanObject({
            patient_id: patientId,
            ...assessmentData
        });

        const { error } = await supabase
            .from('doctor_assessment')
            .upsert(payload, { onConflict: 'patient_id' });

        if (error) throw error;
        await refreshData();
        setSaveStatus('saved');
    } catch (err) {
        setSaveStatus('error');
    }
  };

  const updatePackageProposal = async (patientId: string, proposal: PackageProposal) => {
    const record = patients.find(p => p.id === patientId) || appointments.find(a => a.id === patientId);
    if (record) {
      const patientObj: Patient = 'status' in record ? (record as unknown as Patient) : {
        ...mapRowToPatient({ ...record, booking_status: (record as any).status }),
        packageProposal: proposal
      };
      await updatePatient(patientId, { ...patientObj, packageProposal: proposal });
    }
  };

  const getPatientById = (id: string) => patients.find(p => p.id === id) || (appointments.find(a => a.id === id) as unknown as Patient);

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
        condition: appointmentData.condition,
        entry_date: nullify(appointmentData.date),
        booking_time: nullify(appointmentData.time),
        is_follow_up: appointmentData.bookingType === 'Follow Up',
        booking_status: 'Scheduled',
        hospital_id: 'himas_facility_01'
      };
      const { error } = await supabase.from('himas_appointments').insert(dbRecord);
      if (error) throw error;
      await refreshData();
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const updateAppointment = async (appointment: Appointment) => {
    setSaveStatus('saving');
    try {
      const updateData = {
        entry_date: nullify(appointment.date),
        booking_time: nullify(appointment.time),
        booking_status: appointment.status,
        is_follow_up: appointment.bookingType === 'Follow Up'
      };
      const { error } = await supabase.from('himas_appointments').update(updateData).eq('id', appointment.id);
      if (error) throw error;
      await refreshData();
      setSaveStatus('saved');
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
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const registerStaff = async (staffData: Omit<StaffUser, 'id' | 'registeredAt'>) => {
    setSaveStatus('saving');
    try {
      const newStaff = { 
        ...staffData, 
        id: Math.random().toString(36).substr(2, 9), 
        registered_at: new Date().toISOString() 
      };
      const { error } = await supabase.from('staff_users').insert(newStaff);
      if (error) throw error;
      await refreshData();
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
