
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient, DoctorAssessment, PackageProposal, Role, StaffUser, Appointment } from '../types';
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
  updatePatient: (patient: Patient) => Promise<void>;
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

const STORAGE_KEY_ROLE = 'himas_hospital_role_v1';
const STORAGE_KEY_PATIENTS = 'himas_patients_v2';
const STORAGE_KEY_APPOINTMENTS = 'himas_appointments_v2';
const MOCK_HOSPITAL_ID = '00000000-0000-0000-0000-000000000000';

export const HospitalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUserRole, setCurrentUserRole] = useState<Role>(() => 
    (localStorage.getItem(STORAGE_KEY_ROLE) as Role) || null
  );

  const [patients, setPatients] = useState<Patient[]>(() => {
    const backup = localStorage.getItem(STORAGE_KEY_PATIENTS);
    return backup ? JSON.parse(backup) : [];
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const backup = localStorage.getItem(STORAGE_KEY_APPOINTMENTS);
    return backup ? JSON.parse(backup) : [];
  });

  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStaffLoaded, setIsStaffLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'unsaved'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Persistence to LocalStorage (Safety Fallback)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PATIENTS, JSON.stringify(patients));
    localStorage.setItem(STORAGE_KEY_APPOINTMENTS, JSON.stringify(appointments));
  }, [patients, appointments]);

  useEffect(() => {
    if (currentUserRole) localStorage.setItem(STORAGE_KEY_ROLE, currentUserRole);
    else localStorage.removeItem(STORAGE_KEY_ROLE);
  }, [currentUserRole]);

  const getHospitalId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.user_metadata?.hospital_id || MOCK_HOSPITAL_ID;
  };

  const loadData = async () => {
    if (!currentUserRole) return;
    setIsLoading(true);
    setSaveStatus('saving');

    try {
      const hospitalId = await getHospitalId();
      
      const { data: patientsData, error: pErr } = await supabase
        .from('himas_data')
        .select('*')
        .eq('hospital_id', hospitalId)
        .order('registeredAt', { ascending: false });

      const { data: apptData, error: aErr } = await supabase
        .from('himas_appointments')
        .select('*')
        .eq('hospital_id', hospitalId)
        .order('date', { ascending: true });

      if (!pErr && patientsData && patientsData.length > 0) setPatients(patientsData as Patient[]);
      if (!aErr && apptData && apptData.length > 0) setAppointments(apptData as Appointment[]);

      setSaveStatus('saved');
      setLastSavedAt(new Date());
    } catch (e) {
      console.warn("Using local data cache (Supabase offline or unconfigured)");
      setSaveStatus('unsaved');
    } finally {
      setIsLoading(false);
    }
  };

  const addPatient = async (patientData: Omit<Patient, 'registeredAt' | 'hospital_id'>) => {
    setSaveStatus('saving');
    const hospitalId = await getHospitalId();
    const newPatient: Patient = {
      ...patientData as Patient,
      hospital_id: hospitalId,
      registeredAt: new Date().toISOString()
    };

    // Update Local First
    setPatients(prev => [newPatient, ...prev]);

    try {
      const { error } = await supabase.from('himas_data').insert(newPatient);
      if (error) throw error;
      setSaveStatus('saved');
    } catch (err) {
      console.error("Supabase Save failed, kept in local storage:", err);
      setSaveStatus('unsaved');
    }
  };

  const updatePatient = async (updatedPatient: Patient) => {
    setSaveStatus('saving');
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));

    try {
      const { error } = await supabase.from('himas_data').update(updatedPatient).eq('id', updatedPatient.id);
      if (error) throw error;
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('unsaved');
    }
  };

  const deletePatient = async (id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
    try {
      await supabase.from('himas_data').delete().eq('id', id);
    } catch (e) {}
  };

  const addAppointment = async (apptData: Omit<Appointment, 'id' | 'createdAt' | 'hospital_id' | 'status'>) => {
    setSaveStatus('saving');
    const hospitalId = await getHospitalId();
    const newAppt = {
      ...apptData,
      id: crypto.randomUUID(),
      hospital_id: hospitalId,
      status: 'Scheduled',
      createdAt: new Date().toISOString()
    };

    setAppointments(prev => [...prev, newAppt as Appointment]);

    try {
      const { error } = await supabase.from('himas_appointments').insert(newAppt);
      if (error) throw error;
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('unsaved');
    }
  };

  const updateAppointment = async (updatedAppt: Appointment) => {
    setAppointments(prev => prev.map(a => a.id === updatedAppt.id ? updatedAppt : a));
    try {
      await supabase.from('himas_appointments').update(updatedAppt).eq('id', updatedAppt.id);
    } catch (e) {}
  };

  const deleteAppointment = async (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
    try {
      await supabase.from('himas_appointments').delete().eq('id', id);
    } catch (e) {}
  };

  const fetchFilteredPatients = async (filters: PatientFilters, page: number, pageSize: number) => {
    // For simplicity, we filter the local state for search/pagination
    let filtered = [...patients];
    if (filters.searchTerm) {
      const s = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(s) || p.id.toLowerCase().includes(s) || p.mobile.includes(s));
    }
    if (filters.condition) filtered = filtered.filter(p => p.condition === filters.condition);
    
    const start = page * pageSize;
    return { data: filtered.slice(start, start + pageSize), count: filtered.length };
  };

  const updateDoctorAssessment = async (patientId: string, assessment: DoctorAssessment) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) await updatePatient({ ...patient, doctorAssessment: assessment });
  };

  const updatePackageProposal = async (patientId: string, proposal: PackageProposal) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) await updatePatient({ ...patient, packageProposal: proposal });
  };

  const registerStaff = (staffData: Omit<StaffUser, 'id' | 'registeredAt'>) => {
    const newStaff: StaffUser = { ...staffData, id: `USR-${Date.now()}`, registeredAt: new Date().toISOString() };
    setStaffUsers(prev => [...prev, newStaff]);
  };

  useEffect(() => { if (currentUserRole) loadData(); }, [currentUserRole]);

  return (
    <HospitalContext.Provider value={{
      currentUserRole, setCurrentUserRole, patients, addPatient, updatePatient, deletePatient,
      updateDoctorAssessment, updatePackageProposal, getPatientById: id => patients.find(p => p.id === id),
      fetchFilteredPatients, appointments, addAppointment, updateAppointment, deleteAppointment,
      staffUsers, registerStaff, saveStatus, lastSavedAt, refreshData: loadData, isLoading, isStaffLoaded
    }}>
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = () => {
  const context = useContext(HospitalContext);
  if (!context) throw new Error('useHospital must be used within a HospitalProvider');
  return context;
};
