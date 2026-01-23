
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

const nullify = (val: any) => {
  if (val === undefined || val === null) return null;
  if (typeof val === 'string' && val.trim() === '') return null;
  return val;
};

// Map database row to internal Patient type, transforming package_proposal JSON
const mapRowToPatient = (row: any): Patient => {
  const dbProposal = row.package_proposal;
  let uiProposal: PackageProposal | undefined = undefined;

  if (dbProposal) {
    uiProposal = {
      // Mappings from DB format to UI format
      outcome: dbProposal.status === 'Surgery Fixed' ? 'Scheduled' : dbProposal.status,
      modeOfPayment: dbProposal.paymentMode,
      surgeryDate: dbProposal.outcomeDate,
      outcomeDate: dbProposal.outcomeDate,

      // Type and structure transformations
      packageAmount: dbProposal.packageAmount != null ? String(dbProposal.packageAmount) : undefined,
      equipment: (dbProposal.equipment && Array.isArray(dbProposal.equipment) && dbProposal.equipment.length > 0) ? 'Included' : 'Excluded',

      // Direct mappings
      roomType: dbProposal.roomType,
      stayDays: dbProposal.stayDays,
      icuCharges: dbProposal.icuCharges,
      followUpDate: dbProposal.followUpDate,
      decisionPattern: dbProposal.decisionPattern,
      surgeryMedicines: dbProposal.surgeryMedicines,
      proposalCreatedAt: dbProposal.proposalCreatedAt,
      counselingStrategy: dbProposal.counselingStrategy,
      preOpInvestigation: dbProposal.preOpInvestigation,
      objectionIdentified: dbProposal.objectionIdentified,
      lostReason: dbProposal.lostReason,
      remarks: dbProposal.remarks,
      postFollowUp: dbProposal.postOpFollowUp,
    };
  }

  return {
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
    packageProposal: uiProposal,
    sourceTable: 'himas_appointments'
  };
};

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
      // Fetch from both tables concurrently
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

      // Create a lookup map for assessments
      const assessmentMap = new Map<string, DoctorAssessment>();
      (assessmentRows || []).forEach(asm => {
        assessmentMap.set(asm.patient_id, asm as DoctorAssessment);
      });

      // Map patient rows and join with assessments
      const allRecords = (apptRows || []).map(row => {
        const patient = mapRowToPatient(row);
        patient.doctorAssessment = assessmentMap.get(patient.id);
        return patient;
      });
      
      setPatients(allRecords);
      
      const arrivedPatientIdentifiers = new Set<string>();
      allRecords.forEach(p => {
        if (p.status === 'Arrived' && p.name && p.mobile) {
          arrivedPatientIdentifiers.add(`${p.name.toLowerCase()}|${p.mobile}`);
        }
      });

      const scheduledOnly = (apptRows || [])
        .filter((r: any) => {
            // Condition 1: Must be scheduled to even be considered.
            if (r.booking_status !== 'Scheduled') {
                return false;
            }

            // Condition 2: If an appointment is not for a follow-up, check if a patient with the same
            // name and mobile has already been marked as 'Arrived'. If so, this is a stale appointment
            // that should be hidden from the 'Scheduled' list.
            if (!r.is_follow_up) {
                const identifier = `${(r.name || '').toLowerCase()}|${r.mobile || ''}`;
                if (arrivedPatientIdentifiers.has(identifier)) {
                    return false;
                }
            }
            
            // Show all other scheduled items, including all follow-ups.
            return true;
        })
        .map((r: any) => ({
          id: r.id || '',
          hospital_id: r.hospital_id || '',
          name: r.name || '',
          source: r.source || '',
          condition: (r.condition || Condition.Other) as Condition,
          mobile: r.mobile || '',
          date: r.entry_date || '',
          time: r.booking_time || '',
          status: 'Scheduled',
          bookingType: r.is_follow_up ? 'Follow Up' : 'OPD',
          createdAt: r.created_at || new Date().toISOString()
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
      let dbPackageProposal = null;
      if (patient.packageProposal) {
        const uiProposal = patient.packageProposal;
        dbPackageProposal = {
          status: uiProposal.outcome ? (uiProposal.outcome === 'Scheduled' ? 'Surgery Fixed' : uiProposal.outcome) : null,
          paymentMode: nullify(uiProposal.modeOfPayment),
          outcomeDate: nullify(uiProposal.surgeryDate || uiProposal.outcomeDate),
          roomType: nullify(uiProposal.roomType),
          stayDays: nullify(uiProposal.stayDays),
          icuCharges: nullify(uiProposal.icuCharges),
          followUpDate: nullify(uiProposal.followUpDate),
          decisionPattern: nullify(uiProposal.decisionPattern),
          surgeryMedicines: nullify(uiProposal.surgeryMedicines),
          proposalCreatedAt: uiProposal.proposalCreatedAt,
          counselingStrategy: nullify(uiProposal.counselingStrategy),
          preOpInvestigation: nullify(uiProposal.preOpInvestigation),
          objectionIdentified: nullify(uiProposal.objectionIdentified),
          lostReason: nullify(uiProposal.lostReason),
          remarks: nullify(uiProposal.remarks),
          postOpFollowUp: nullify(uiProposal.postFollowUp),
          packageAmount: uiProposal.packageAmount ? parseInt(uiProposal.packageAmount.replace(/,/g, ''), 10) : null,
          equipment: uiProposal.equipment === 'Included' ? [uiProposal.equipment] : [],
        };
      }

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
        entry_date: nullify(patient.entry_date) || new Date().toISOString().split('T')[0],
        booking_status: patient.status === 'Scheduled' ? 'Scheduled' : 'Arrived',
        package_proposal: dbPackageProposal,
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
      // Deleting from himas_appointments will cascade and delete from doctor_assessment
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
        const payload = {
            patient_id: patientId,
            ...assessmentData
        };

        const { error } = await supabase
            .from('doctor_assessment')
            .upsert(payload, { onConflict: 'patient_id' });

        if (error) throw error;
        await refreshData();
        setSaveStatus('saved');
    } catch (err) {
        console.error("Error updating assessment:", err);
        setSaveStatus('error');
    }
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
