export interface BaseUserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "ADMIN" | "DOCTOR" | "THERAPIST" | "RECEPTIONIST" | "PATIENT";
  enabled: boolean;
  verificationStatus: "PENDING_VERIFICATION" | "APPROVED" | "REJECTED" | "SUSPENDED" | "INVITED" | "INVITATION_EXPIRED";
  rejectionReason?: string;
  clinicId?: string;
  profilePictureUrl?: string;
  gender?: string;
  dateOfBirth?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  address?: string;
  lastLogin?: string;
  createdAt?: string;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  specialization?: string;
  qualification?: string;
  experienceYears?: number;
  licenseNumber?: string;
  stateCouncil?: string;
  address?: string;
  degreeCertificateUrl?: string;
  registrationCertificateUrl?: string;
  additionalCertificatesUrl?: string;
  clinicId?: string;
  available: boolean;
  profilePictureUrl?: string;
  gender?: string;
  dateOfBirth?: string;
}

export interface TherapistProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  specialization?: string;
  qualification?: string;
  experienceYears?: number;
  therapistType?: string;
  therapySkills?: string[];
  trainingCertifications?: string;
  qualificationCertificateUrl?: string;
  trainingCertificateUrl?: string;
  address?: string;
  clinicId?: string;
  available: boolean;
  profilePictureUrl?: string;
  gender?: string;
  dateOfBirth?: string;
}

export interface ReceptionistProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  idProofDocumentUrl?: string;
  clinicId?: string;
  available: boolean;
  profilePictureUrl?: string;
  gender?: string;
  dateOfBirth?: string;
}

export interface PatientProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  age?: number;
  gender?: string;
  address?: string;
  medicalHistory?: string;
  primaryDosha?: string;
  vataPercentage?: number;
  pittaPercentage?: number;
  kaphaPercentage?: number;
  prakritiNotes?: string;
  profilePictureUrl?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  emergencyContact?: string;
}

export interface UpdateUserProfileRequest {
  fullName: string;
  phone: string;
  gender?: string;
  dateOfBirth?: string;
  profilePictureUrl?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  address?: string;
}

export interface UpdateDoctorProfileRequest {
  fullName: string;
  phone: string;
  specialization?: string;
  qualification?: string;
  experienceYears?: number;
  address?: string;
  available?: boolean;
  profilePictureUrl?: string;
  gender?: string;
  dateOfBirth?: string;
}

export interface UpdateTherapistProfileRequest {
  fullName: string;
  phone: string;
  specialization?: string;
  qualification?: string;
  experienceYears?: number;
  therapistType?: string;
  therapySkills?: string[];
  trainingCertifications?: string;
  address?: string;
  available?: boolean;
  profilePictureUrl?: string;
  gender?: string;
  dateOfBirth?: string;
}

export interface UpdateReceptionistProfileRequest {
  fullName: string;
  phone: string;
  address?: string;
  available?: boolean;
  profilePictureUrl?: string;
  gender?: string;
  dateOfBirth?: string;
}

export interface UpdatePatientProfileRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  age?: number;
  gender?: string;
  address?: string;
  medicalHistory?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}
