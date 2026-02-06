
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
  convertAppointment: (appointmentId: string, patientData: Omit<Patient, 'registeredAt' | 'hospital_id'>) => Promise<void>;
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

const mapRowToPatient = (row: any): Patient => {
  const dbProposal = row.package_proposal;
  let uiProposal: PackageProposal | undefined = undefined;

  if (dbProposal || row.follow_up_date || row.surgery_date || row.completed_surgery || row.surgery_lost_date) {
    let outcomeStatus = dbProposal?.status;
    if (outcomeStatus === 'Surgery Fixed' || outcomeStatus === 'Schedule Surgery') {
      outcomeStatus = 'Scheduled';
    } else if (outcomeStatus === 'Surgery Lost') {
      outcomeStatus = 'Lost';
    } else if (outcomeStatus === 'Surgery Completed') {
      outcomeStatus = 'Completed';
    }

    uiProposal = {
      outcome: (outcomeStatus || undefined) as ProposalOutcome,
      modeOfPayment: dbProposal?.paymentMode || undefined,
      surgeryDate: row.surgery_date || dbProposal?.surgeryDate || dbProposal?.outcomeDate || undefined,
      outcomeDate: row.completed_surgery || row.surgery_lost_date || dbProposal?.outcomeDate || undefined,
      roomType: dbProposal?.roomType || undefined,
      stayDays: dbProposal?.stayDays || undefined,
      icuCharges: dbProposal?.icuCharges || undefined,
      surgeryMedicines: dbProposal?.surgeryMedicines || undefined,
      preOpInvestigation: dbProposal?.preOpInvestigation || undefined,
      lostReason: dbProposal?.lostReason || undefined,
      remarks: row.remarks || dbProposal?.remarks || undefined,
      postFollowUp: dbProposal?.postOpFollowUp || undefined,
      postFollowUpCount: dbProposal?.postOpFollowUpCount || undefined,
      packageAmount: dbProposal?.packageAmount != null ? String(dbProposal.packageAmount) : undefined,
      equipment: (dbProposal?.equipment && Array.isArray(dbProposal.equipment) && dbProposal.equipment.length > 0) ? 'Included' : 'Excluded',
      decisionPattern: dbProposal?.decisionPattern || '',
      objectionIdentified: dbProposal?.objectionIdentified || '',
      counselingStrategy: dbProposal?.counselingStrategy || '',
      followUpDate: row.followup_date || row.follow_up_date || dbProposal?.followUpDate || '',
      proposalCreatedAt: dbProposal?.proposalCreatedAt || new Date().toISOString(),
    };
  }
  
  let uiAssessment: DoctorAssessment | undefined = undefined;
  if (row.doctor_assessment) {
    uiAssessment = {
      ...row.doctor_assessment,
      patient_id: row.id,
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
    visit_type: row.visit_type || '',
    registeredAt: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || row.created_at || new Date().toISOString(),
    status_updated_at: row.status_updated_at || null,
    entry_date: row.entry_date || '',
    arrivalTime: row.arrival_time || '',
    status: row.booking_status || 'Arrived',
    packageProposal: uiProposal,
    doctorAssessment: uiAssessment,
    surgery_date: row.surgery_date || '',
    followup_date: row.followup_date || '',
    surgery_lost_date: row.surgery_lost_date || '',
    completed_surgery: row.completed_surgery || '',
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

  const syncToSheets = async (patient: any) => {
    const url = process.env.VITE_APPSCRIPT_URL;
    if (!url) return;
    try {
      fetch(url, {
        method: 'POST',
        body: JSON.stringify(patient),
        mode: 'no-cors',
      });
    } catch (e) {
      console.warn('Google Sheets sync background error:', e);
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [
        { data: apptRows, error: apptError },
        { data: staffData, error: staffError }
      ] = await Promise.all([
        supabase.from('himas_appointments').select('*').order('created_at', { ascending: false }),
        supabase.from('staff_users').select('*')
      ]);

      if (apptError) throw apptError;

      const consolidatedPatients = (apptRows || [])
        .filter((r: any) => 
          r.booking_status === 'Arrived' || 
          r.doctor_assessment !== null || 
          r.package_proposal !== null
        )
        .map(row => mapRowToPatient(row));
      
      setPatients(consolidatedPatients);
      
      const appointmentLeads = (apptRows || [])
        .filter((r: any) => 
          ['Scheduled', 'Follow Up'].includes(r.booking_status) && 
          r.doctor_assessment === null &&
          r.package_proposal === null
        )
        .map((r: any) => ({
          id: r.id || '',
          hospital_id: r.hospital_id || '',
          name: r.name || '',
          source: r.source || '',
          source_doctor_name: r.source_doctor_name || '',
          condition: (r.condition || Condition.Other) as Condition,
          mobile: r.mobile || '',
          date: r.entry_date || '',
          time: r.booking_time || '',
          status: r.booking_status || 'Scheduled',
          bookingType: r.booking_status === 'Follow Up' ? 'Follow Up' : 'Scheduled',
          visit_type: r.visit_type || '',
          createdAt: r.created_at || new Date().toISOString()
        }));
      setAppointments(appointmentLeads as Appointment[]);

      if (!staffError && staffData) {
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
        visit_type: patientData.visit_type || '',
        has_insurance: patientData.hasInsurance,
        insurance_name: patientData.insuranceName,
        booking_status: 'Arrived',
        entry_date: patientData.entry_date || new Date().toISOString().split('T')[0],
        arrival_time: patientData.arrivalTime || new Date().toTimeString().split(' ')[0],
        hospital_id: 'himas_facility_01',
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase.from('himas_appointments').insert(dbRecord);
      if (error) throw error;
      
      syncToSheets({ ...patientData, registeredAt: dbRecord.updated_at, status: 'Arrived' });
      await refreshData();
      setSaveStatus('saved');
    } catch (err) {
      console.error('Add Patient Error:', err);
      setSaveStatus('error');
    }
  };

  const updatePatient = async (targetId: string, patient: Patient) => {
    setSaveStatus('saving');
    try {
      const existingPatient = patients.find(p => p.id === targetId);
      let dbPackageProposal = null;
      let followUpDateVal = null;
      let surgeryDateVal = null;
      let surgeryLostDateVal = null;
      let completedSurgeryVal = null;
      let remarksVal = null;
      
      const oldOutcome = existingPatient?.packageProposal?.outcome;
      const newOutcome = patient.packageProposal?.outcome;
      let statusUpdatedAtVal = existingPatient?.status_updated_at;

      if (newOutcome && newOutcome !== oldOutcome) {
        statusUpdatedAtVal = new Date().toISOString();
      }

      if (patient.packageProposal) {
        const uiProposal = patient.packageProposal;
        followUpDateVal = nullify(uiProposal.followUpDate);
        surgeryDateVal = nullify(uiProposal.surgeryDate);
        remarksVal = nullify(uiProposal.remarks);
        
        if (uiProposal.outcome === 'Lost') {
          surgeryLostDateVal = nullify(uiProposal.outcomeDate);
        } else if (uiProposal.outcome === 'Completed') {
          completedSurgeryVal = nullify(uiProposal.outcomeDate);
        }

        dbPackageProposal = {
          status: uiProposal.outcome ? (uiProposal.outcome === 'Scheduled' ? 'Surgery Fixed' : (uiProposal.outcome === 'Completed' ? 'Surgery Completed' : uiProposal.outcome)) : null,
          paymentMode: nullify(uiProposal.modeOfPayment),
          outcomeDate: nullify(uiProposal.outcomeDate || uiProposal.surgeryDate),
          roomType: nullify(uiProposal.roomType),
          stayDays: nullify(uiProposal.stayDays),
          icuCharges: nullify(uiProposal.icuCharges),
          followUpDate: followUpDateVal,
          decisionPattern: nullify(uiProposal.decisionPattern),
          surgeryMedicines: nullify(uiProposal.surgeryMedicines),
          proposalCreatedAt: uiProposal.proposalCreatedAt,
          counselingStrategy: nullify(uiProposal.counselingStrategy),
          preOpInvestigation: nullify(uiProposal.preOpInvestigation),
          objectionIdentified: nullify(uiProposal.objectionIdentified),
          lostReason: nullify(uiProposal.lostReason),
          remarks: remarksVal,
          postOpFollowUp: nullify(uiProposal.postFollowUp),
          postOpFollowUpCount: nullify(uiProposal.postFollowUpCount),
          packageAmount: uiProposal.packageAmount ? parseInt(uiProposal.packageAmount.replace(/,/g, ''), 10) : null,
          equipment: uiProposal.equipment,
        };
      }

      const updateData = {
        name: patient.name,
        dob: nullify(patient.dob),
        age: patient.age,
        gender: patient.gender,
        mobile: patient.mobile,
        occupation: patient.occupation,
        source: patient.source,
        condition: patient.condition,
        is_follow_up: patient.visitType === 'Follow Up',
        visit_type: patient.visit_type || existingPatient?.visit_type || '',
        has_insurance: patient.hasInsurance,
        insurance_name: patient.insuranceName,
        source_doctor_name: patient.sourceDoctorName,
        entry_date: nullify(patient.entry_date) || new Date().toISOString().split('T')[0],
        arrival_time: nullify(patient.arrivalTime) || new Date().toTimeString().split(' ')[0],
        booking_status: patient.status || 'Arrived',
        package_proposal: dbPackageProposal,
        doctor_assessment: patient.doctorAssessment || null,
        remarks: remarksVal,
        follow_up_date: followUpDateVal,
        followup_date: followUpDateVal,
        surgery_date: surgeryDateVal,
        surgery_lost_date: surgeryLostDateVal,
        completed_surgery: completedSurgeryVal,
        status_updated_at: statusUpdatedAtVal,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase.from('himas_appointments').update(updateData).eq('id', targetId);
      if (error) throw error;
      
      syncToSheets(patient);
      await refreshData();
      setSaveStatus('saved');
    } catch (err) {
      console.error('Update Patient Error:', err);
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
  
  const convertAppointment = async (appointmentId: string, patientData: Omit<Patient, 'registeredAt' | 'hospital_id'>) => {
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
            visit_type: patientData.visit_type || '',
            has_insurance: patientData.hasInsurance,
            insurance_name: patientData.insuranceName,
            booking_status: 'Arrived',
            entry_date: patientData.entry_date || new Date().toISOString().split('T')[0],
            arrival_time: patientData.arrivalTime || new Date().toTimeString().split(' ')[0],
            hospital_id: 'himas_facility_01',
            updated_at: new Date().toISOString()
        };
        
        const { error: insertError } = await supabase.from('himas_appointments').insert(dbRecord);
        if (insertError) throw insertError;
        const { error: deleteError } = await supabase.from('himas_appointments').delete().eq('id', appointmentId);
        
        syncToSheets({ ...patientData, registeredAt: dbRecord.updated_at, status: 'Arrived' });
        await refreshData();
        setSaveStatus('saved');
    } catch (err) {
        setSaveStatus('error');
    }
  };

  const updateDoctorAssessment = async (patientId: string, assessmentData: Partial<DoctorAssessment>) => {
    setSaveStatus('saving');
    try {
        const patient = patients.find(p => p.id === patientId);
        if (!patient) throw new Error("Patient not found");
        const existingAssessment = patient.doctorAssessment || {};
        const updatedAssessment = {
            ...existingAssessment,
            ...assessmentData,
            assessedAt: new Date().toISOString()
        };
        const { error } = await supabase
            .from('himas_appointments')
            .update({ 
                doctor_assessment: updatedAssessment,
                updated_at: new Date().toISOString()
            })
            .eq('id', patientId);
        if (error) throw error;

        syncToSheets({ ...patient, doctorAssessment: updatedAssessment });
        await refreshData();
        setSaveStatus('saved');
    } catch (err) {
        setSaveStatus('error');
    }
  };

  const updatePackageProposal = async (patientId: string, proposal: PackageProposal) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) await updatePatient(patientId, { ...patient, packageProposal: proposal });
  };

  const getPatientById = (id: string) => patients.find(p => p.id === id);
  const fetchFilteredPatients = async (filters: PatientFilters, page: number, pageSize: number) => { return { data: patients, count: patients.length }; };

  const addAppointment = async (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'hospital_id' | 'status'>) => {
    setSaveStatus('saving');
    try {
      const dbRecord = {
        id: `APP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        name: appointmentData.name,
        mobile: appointmentData.mobile,
        source: appointmentData.source,
        source_doctor_name: nullify(appointmentData.sourceDoctorName),
        condition: appointmentData.condition,
        entry_date: nullify(appointmentData.date),
        booking_time: nullify(appointmentData.time),
        is_follow_up: appointmentData.bookingType === 'Follow Up',
        booking_status: appointmentData.bookingType || 'Scheduled',
        visit_type: (appointmentData as any).visit_type || '',
        hospital_id: 'himas_facility_01',
        updated_at: new Date().toISOString()
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
        name: appointment.name,
        mobile: appointment.mobile,
        source: appointment.source,
        source_doctor_name: nullify(appointment.sourceDoctorName),
        condition: appointment.condition,
        entry_date: nullify(appointment.date),
        booking_time: nullify(appointment.time),
        booking_status: appointment.bookingType, 
        is_follow_up: appointment.bookingType === 'Follow Up',
        visit_type: appointment.visit_type || '',
        updated_at: new Date().toISOString()
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
        id: Math.random().toString(36).substring(2, 11), 
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
      patients, addPatient, updatePatient, deletePatient, convertAppointment,
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
