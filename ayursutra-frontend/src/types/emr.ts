export interface MedicationItem {
  name: string;
  dosage: string;
  frequency: string;
  purpose: string;
  startDate?: string;
}

export interface SurgeryItem {
  procedureName: string;
  year?: number;
  hospitalOrDoctor?: string;
  notes?: string;
}

export interface PrescribedMedicineItem {
  medicineName: string;
  formulation?: string;
  dosage: string;
  timing: string;
  durationDays?: number;
  instructions?: string;
}

export interface TherapyObservationItem {
  id?: string;
  therapistId?: string;
  therapistUserId?: string;
  therapistName: string;
  therapySessionId?: string;
  therapyName?: string;
  observation: string;
  patientFeedback?: string;
  vitalPulse?: number;
  vitalBloodPressure?: string;
  recordedAt: string;
}

export interface MedicalRecordAuditItem {
  action: string;
  performedByUserId?: string;
  performedByName?: string;
  performedByRole?: string;
  summary: string;
  timestamp: string;
}

export interface PatientMedicalRecord {
  id?: string;
  patientId: string;
  clinicId?: string;

  // Vitals
  bloodGroup?: string;
  heightCm?: number;
  weightKg?: number;
  bloodPressure?: string;
  pulseRate?: number;

  // Medical history
  chronicConditions: string[];
  allergies: string[];
  currentMedications: MedicationItem[];
  pastSurgeries: SurgeryItem[];
  familyMedicalHistory: string[];
  lifestyleHabits: string[];
  dietaryHabits?: string;
  previousTreatments?: string;
  clinicalObservations?: string;

  // Ayurvedic profile
  prakritiDominant?: string;
  vataPercentage?: number;
  pittaPercentage?: number;
  kaphaPercentage?: number;
  vikritiImbalance?: string;
  agniType?: string;
  amaStatus?: string;
  koshtha?: string;
  dhatuImbalances: string[];
  malaObservations?: string;
  sleepQuality?: string;
  appetiteDigestion?: string;

  auditHistory: MedicalRecordAuditItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DoctorClinicalNote {
  id: string;
  patientId: string;
  clinicId?: string;
  appointmentId?: string;

  doctorId?: string;
  doctorUserId?: string;
  doctorName: string;
  doctorSpecialization?: string;

  consultationDate: string;
  consultationTime: string;
  visitType: string;

  chiefComplaints?: string;
  symptoms: string[];
  clinicalObservations?: string;
  diagnosis: string;

  prakritiObservation?: string;
  vikritiObservation?: string;
  nadiPariksha?: string;
  jihvaPariksha?: string;
  netraPariksha?: string;
  agniObservation?: string;
  amaObservation?: string;

  treatmentRecommendations?: string;
  prescribedMedicines: PrescribedMedicineItem[];
  recommendedTherapies: string[];
  dietaryAdvice?: string;
  lifestyleInstructions?: string;

  followUpDate?: string;
  followUpInstructions?: string;
  isConfidential?: boolean;

  therapistNotes: TherapyObservationItem[];
  auditHistory: MedicalRecordAuditItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DoshaAssessmentResponse {
  primaryDosha: string;
  secondaryDosha?: string;
  vataPercentage: number;
  pittaPercentage: number;
  kaphaPercentage: number;
  characteristics?: string;
  recommendedTherapies?: string[];
  dietaryGuidelines?: string[];
  lifestyleRecommendations?: string[];
}

export interface PatientResponse {
  id: string;
  userId?: string;
  fullName: string;
  email: string;
  phone?: string;
  age?: number;
  gender?: string;
  address?: string;
  medicalHistory?: string;
  primaryDosha?: string;
  vataPercentage?: number;
  pittaPercentage?: number;
  kaphaPercentage?: number;
}

export interface PatientEMRSummaryResponse {
  patient: PatientResponse;
  medicalRecord?: PatientMedicalRecord;
  consultationNotes: DoctorClinicalNote[];
  doshaAssessment?: DoshaAssessmentResponse;
  therapyPlans: any[];
  therapySessions: any[];
  dietPlans: any[];
  progressRecords: any[];
  appointments: any[];
  canEditMedicalRecord?: boolean;
  canAddClinicalNote?: boolean;
  canAddTherapyObservation?: boolean;
  canViewConfidentialNotes?: boolean;
}

export interface UpsertMedicalRecordRequest {
  bloodGroup?: string;
  heightCm?: number;
  weightKg?: number;
  bloodPressure?: string;
  pulseRate?: number;
  chronicConditions?: string[];
  allergies?: string[];
  currentMedications?: MedicationItem[];
  pastSurgeries?: SurgeryItem[];
  familyMedicalHistory?: string[];
  lifestyleHabits?: string[];
  dietaryHabits?: string;
  previousTreatments?: string;
  clinicalObservations?: string;
  prakritiDominant?: string;
  vataPercentage?: number;
  pittaPercentage?: number;
  kaphaPercentage?: number;
  vikritiImbalance?: string;
  agniType?: string;
  amaStatus?: string;
  koshtha?: string;
  dhatuImbalances?: string[];
  malaObservations?: string;
  sleepQuality?: string;
  appetiteDigestion?: string;
}

export interface CreateClinicalNoteRequest {
  patientId: string;
  appointmentId?: string;
  doctorId?: string;
  consultationDate?: string;
  consultationTime?: string;
  visitType?: string;
  chiefComplaints?: string;
  symptoms?: string[];
  clinicalObservations?: string;
  diagnosis: string;
  prakritiObservation?: string;
  vikritiObservation?: string;
  nadiPariksha?: string;
  jihvaPariksha?: string;
  netraPariksha?: string;
  agniObservation?: string;
  amaObservation?: string;
  treatmentRecommendations?: string;
  prescribedMedicines?: PrescribedMedicineItem[];
  recommendedTherapies?: string[];
  dietaryAdvice?: string;
  lifestyleInstructions?: string;
  followUpDate?: string;
  followUpInstructions?: string;
  isConfidential?: boolean;
}

export interface UpdateClinicalNoteRequest {
  chiefComplaints?: string;
  symptoms?: string[];
  clinicalObservations?: string;
  diagnosis?: string;
  prakritiObservation?: string;
  vikritiObservation?: string;
  nadiPariksha?: string;
  jihvaPariksha?: string;
  netraPariksha?: string;
  agniObservation?: string;
  amaObservation?: string;
  treatmentRecommendations?: string;
  prescribedMedicines?: PrescribedMedicineItem[];
  recommendedTherapies?: string[];
  dietaryAdvice?: string;
  lifestyleInstructions?: string;
  followUpDate?: string;
  followUpInstructions?: string;
  isConfidential?: boolean;
  editReason?: string;
}

export interface AddTherapyObservationRequest {
  therapySessionId?: string;
  therapyName?: string;
  observation: string;
  patientFeedback?: string;
  vitalPulse?: number;
  vitalBloodPressure?: string;
}
