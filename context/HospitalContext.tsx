
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient, DoctorAssessment, PackageProposal, Role, StaffUser } from '../types';
import { supabase } from '../services/supabaseClient';

interface HospitalContextType {
  currentUserRole: Role;
  setCurrentUserRole: (role: Role) => void;
  // Patient Data
  patients: Patient[];
  addPatient: (patientData: Omit<Patient, 'registeredAt' | 'hospital_id'>) => Promise<void>; 
  updatePatient: (patient: Patient) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  updateDoctorAssessment: (patientId: string, assessment: DoctorAssessment) => Promise<void>;
  updatePackageProposal: (patientId: string, proposal: PackageProposal) => Promise<void>;
  getPatientById: (id: string) => Patient | undefined;
  // Staff Data
  staffUsers: StaffUser[];
  registerStaff: (staffData: Omit<StaffUser, 'id' | 'registeredAt'>) => void;
  // System State
  saveStatus: 'saved' | 'saving' | 'error' | 'unsaved';
  lastSavedAt: Date | null;
  refreshData: () => Promise<void>;
  isLoading: boolean;
  isStaffLoaded: boolean;
}

const HospitalContext = createContext<HospitalContextType | undefined>(undefined);

const STORAGE_KEY_ROLE = 'himas_hospital_role_v1';
const STORAGE_KEY_PATIENTS = 'himas_patients_backup_v1';
const SHARED_STAFF_KEY = 'HIMAS_STAFF_DATA';

export const HospitalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUserRole, setCurrentUserRole] = useState<Role>(() => {
    return (localStorage.getItem(STORAGE_KEY_ROLE) as Role) || null;
  });

  const [patients, setPatients] = useState<Patient[]>(() => {
    const backup = localStorage.getItem(STORAGE_KEY_PATIENTS);
    return backup ? JSON.parse(backup) : [];
  });
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isStaffLoaded, setIsStaffLoaded] = useState(false);
  
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'unsaved'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Persist role selection
  useEffect(() => {
    if (currentUserRole) {
      localStorage.setItem(STORAGE_KEY_ROLE, currentUserRole);
    } else {
      localStorage.removeItem(STORAGE_KEY_ROLE);
    }
  }, [currentUserRole]);

  // Persist patients to local storage for offline support
  useEffect(() => {
    if (patients.length > 0) {
      localStorage.setItem(STORAGE_KEY_PATIENTS, JSON.stringify(patients));
    }
  }, [patients]);

  // Load staff data (Shared lookup)
  useEffect(() => {
    const loadStaffData = async () => {
      try {
        const { data, error } = await supabase
          .from("app_data")
          .select("data")
          .eq("role", SHARED_STAFF_KEY)
          .maybeSingle();
        
        if (!error && data?.data) setStaffUsers(data.data);
      } catch(e) { 
        console.error("Staff sync failed", e); 
      } finally {
        setIsStaffLoaded(true);
      }
    };
    loadStaffData();
  }, []);

  // --- SELECT DATA (SCOPED BY HOSPITAL_ID) ---
  const loadData = async () => {
    if (!currentUserRole) return;
    setIsLoading(true);
    setSaveStatus('saving');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && user.user_metadata?.hospital_id) {
        const hospitalId = user.user_metadata.hospital_id;
        
        const { data, error } = await supabase
          .from('himas_data')
          .select('*')
          .eq('hospital_id', hospitalId)
          .order('registeredAt', { ascending: false });

        if (error) throw error;
        
        if (data) {
          setPatients(data as Patient[]);
          setSaveStatus('saved');
          setLastSavedAt(new Date());
        }
      } else {
        // Fallback to local data if no user session found but role is set (offline mode)
        console.warn("No active Supabase session. Using local data.");
        setSaveStatus('unsaved');
      }
    } catch (e: any) {
      console.error("Dashboard Load Error:", e);
      setSaveStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserRole) {
      loadData();
    }
  }, [currentUserRole]);

  // Real-time synchronization
  useEffect(() => {
    if (!currentUserRole) return;

    let channel: any;

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const hospitalId = user?.user_metadata?.hospital_id;
      if (!hospitalId) return;

      channel = supabase
        .channel(`hospital_realtime_${hospitalId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'himas_data',
          filter: `hospital_id=eq.${hospitalId}`
        }, (payload: any) => {
            if (payload.eventType === 'INSERT') {
              setPatients(prev => [payload.new as Patient, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setPatients(prev => prev.map(p => p.id === payload.new.id ? payload.new as Patient : p));
            } else if (payload.eventType === 'DELETE') {
              setPatients(prev => prev.filter(p => p.id !== payload.old.id));
            }
            setLastSavedAt(new Date());
            setSaveStatus('saved');
        })
        .subscribe();
    };

    setupSubscription();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [currentUserRole]);

  // --- INSERT PATIENT ---
  const addPatient = async (patientData: Omit<Patient, 'registeredAt' | 'hospital_id'>) => {
    setSaveStatus('saving');
    const newPatient: Patient = {
      ...patientData as Patient,
      registeredAt: new Date().toISOString()
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const hospitalId = user?.user_metadata?.hospital_id;

      if (hospitalId) {
        const { error } = await supabase
          .from('himas_data')
          .insert({
            ...patientData,
            hospital_id: hospitalId,
            registeredAt: newPatient.registeredAt
          });

        if (error) throw error;
        setSaveStatus('saved');
      } else {
        // Mock success for offline/local-only
        setPatients(prev => [newPatient, ...prev]);
        setSaveStatus('unsaved');
      }
    } catch (err) {
      console.error("Registration Error:", err);
      // Fallback: Add locally anyway
      setPatients(prev => [newPatient, ...prev]);
      setSaveStatus('error');
    }
  };

  // --- UPDATE PATIENT ---
  const updatePatient = async (updatedPatient: Patient) => {
    setSaveStatus('saving');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const hospitalId = user?.user_metadata?.hospital_id;

      if (hospitalId) {
        const { error } = await supabase
          .from('himas_data')
          .update(updatedPatient)
          .eq('id', updatedPatient.id)
          .eq('hospital_id', hospitalId);

        if (error) throw error;
        setSaveStatus('saved');
      } else {
        setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
        setSaveStatus('unsaved');
      }
    } catch (err) {
      console.error("Update Error:", err);
      setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
      setSaveStatus('error');
    }
  };

  // --- DELETE PATIENT ---
  const deletePatient = async (id: string) => {
    setSaveStatus('saving');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const hospitalId = user?.user_metadata?.hospital_id;

      if (hospitalId) {
        const { error } = await supabase
          .from('himas_data')
          .delete()
          .eq('id', id)
          .eq('hospital_id', hospitalId);

        if (error) throw error;
        setSaveStatus('saved');
      } else {
        setPatients(prev => prev.filter(p => p.id !== id));
        setSaveStatus('unsaved');
      }
    } catch (err) {
      console.error("Deletion Error:", err);
      setPatients(prev => prev.filter(p => p.id !== id));
      setSaveStatus('error');
    }
  };

  const updateDoctorAssessment = async (patientId: string, assessment: DoctorAssessment) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      await updatePatient({ ...patient, doctorAssessment: assessment });
    }
  };

  const updatePackageProposal = async (patientId: string, proposal: PackageProposal) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      await updatePatient({ ...patient, packageProposal: proposal });
    }
  };

  const registerStaff = (staffData: Omit<StaffUser, 'id' | 'registeredAt'>) => {
    const newStaff: StaffUser = {
      ...staffData,
      id: `USR-${Date.now()}`,
      registeredAt: new Date().toISOString()
    };
    setStaffUsers(prev => [...prev, newStaff]);
  };

  const getPatientById = (id: string) => patients.find(p => p.id === id);

  return (
    <HospitalContext.Provider value={{
      currentUserRole,
      setCurrentUserRole,
      patients,
      addPatient,
      updatePatient,
      deletePatient,
      updateDoctorAssessment,
      updatePackageProposal,
      getPatientById,
      staffUsers,
      registerStaff,
      saveStatus,
      lastSavedAt,
      refreshData: loadData,
      isLoading,
      isStaffLoaded
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
