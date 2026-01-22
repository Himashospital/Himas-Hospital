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
  quickCode: SurgeonCode;
  painSeverity: PainSeverity;
  affordability: Affordability;
  conversionReadiness: ConversionReadiness;
  tentativeSurgeryDate: string; // YYYY-MM-DD
  doctorSignature: string;
  assessedAt: string;
}

export interface PackageProposal {
  decisionPattern: string;
  objectionIdentified: string;
  counselingStrategy: string;
  followUpDate: string; // YYYY-MM-DD
  proposalCreatedAt: string;
}

export interface Patient {
  id: string; // File Registration Number
  hospital_id: string; // Multi-tenancy identifier
  // Front Office Fields
  name: string;
  dob?: string; // Date of Birth YYYY-MM-DD
  gender: Gender;
  age: number;
  mobile: string;
  occupation: string;
  hasInsurance: 'Yes' | 'No' | 'Not Sure';
  insuranceName?: string; 
  source: string; 
  condition: Condition;
  registeredAt: string;
  
  // Role Specific Data
  doctorAssessment?: DoctorAssessment;
  packageProposal?: PackageProposal;
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