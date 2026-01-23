

export type Role = 'FRONT_OFFICE' | 'DOCTOR' | 'PACKAGE_TEAM' | null;

export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other',
}

export enum Condition {
  Piles = 'Piles',
  Fissure = 'Fissure',
  Fistula = 'Fistula',
  Hernia = 'Hernia',
  Gallstones = 'Gallstones',
  Appendix = 'Appendix',
  VaricoseVeins = 'Varicose Veins',
  Other = 'Other',
}

export enum SurgeonCode {
  M1 = 'M1 - Medication Only',
  S1 = 'S1 - Surgery Recommended',
}

export enum PainSeverity {
  Low = 'Low',
  Moderate = 'Moderate',
  High = 'High',
}

export enum Affordability {
  A1 = 'A1 - Basic',
  A2 = 'A2 - Mid',
  A3 = 'A3 - Premium',
}

export enum ConversionReadiness {
  CR1 = 'CR1 - Ready',
  CR2 = 'CR2 - Needs Push',
  CR3 = 'CR3 - Needs Counseling',
  CR4 = 'CR4 - Not Ready',
}

export interface DoctorAssessment {
  id?: string;
  patient_id: string;
  notes?: string;
  quick_code?: SurgeonCode;
  assessed_at?: string;
  pain_severity?: PainSeverity;
  affordability?: Affordability;
  doctor_signature?: string;
  other_surgery_name?: string;
  conversion_readiness?: ConversionReadiness;
  tentative_surgery_date?: string; // YYYY-MM-DD
}

export type ProposalOutcome = 'Scheduled' | 'Follow-Up' | 'Lost';

export interface PackageProposal {
  decisionPattern: string;
  objectionIdentified: string;
  counselingStrategy: string;
  followUpDate: string; // YYYY-MM-DD
  proposalCreatedAt: string;
  modeOfPayment?: 'Cash' | 'Insurance' | 'Partly' | 'Insurance Approved';
  packageAmount?: string;
  preOpInvestigation?: 'Included' | 'Excluded';
  surgeryMedicines?: 'Included' | 'Excluded';
  equipment?: 'Included' | 'Excluded';
  icuCharges?: 'Included' | 'Excluded';
  roomType?: 'Private' | 'Deluxe' | 'Semi';
  stayDays?: number;
  postFollowUp?: 'None' | 'Single' | 'Double' | 'Excluded';
  surgeryDate?: string;
  remarks?: string;
  outcome?: ProposalOutcome;
  outcomeDate?: string;
  lostReason?: string;
}

export interface Patient {
  id: string; 
  hospital_id: string; 
  name: string;
  dob?: string; 
  gender: Gender;
  age: number;
  mobile: string;
  occupation: string;
  hasInsurance: 'Yes' | 'No' | 'Not Sure';
  insuranceName?: string; 
  source: string;
  sourceDoctorName?: string;
  condition: Condition;
  visitType: 'OPD' | 'Follow Up';
  registeredAt: string;
  entry_date?: string;
  status?: string;
  
  // Metadata for multi-table support
  sourceTable?: 'himas_data' | 'himas_appointments';

  // Role Specific Data
  doctorAssessment?: DoctorAssessment;
  packageProposal?: PackageProposal;
}

export interface Appointment {
  id: string;
  hospital_id: string;
  name: string;
  source: string;
  condition: Condition;
  mobile: string;
  date: string; 
  time: string; 
  status: 'Scheduled' | 'Arrived' | 'Cancelled';
  bookingType: 'Follow Up' | 'OPD';
  createdAt: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: Role;
  registeredAt: string;
  password?: string;
}

export interface DashboardStats {
  totalPatients: number;
  pendingDoctor: number;
  pendingPackage: number;
  readyForSurgery: number;
}