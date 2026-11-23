import apiClient from "../api/client";

export type Role = "DOCTOR" | "THERAPIST" | "RECEPTIONIST" | "ADMIN" | "PATIENT";
export type InvitationStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
export type VerificationStatus =
  | "INVITED"
  | "PENDING_VERIFICATION"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED"
  | "INVITATION_EXPIRED";

export interface StaffInvitationResponse {
  id: string;
  invitationToken: string;
  email: string;
  fullName?: string;
  phone?: string;
  role: Role;
  clinicId: string;
  clinicName: string;
  status: InvitationStatus;
  expiresAt: string;
  invitationLink: string;
  invitedByEmail: string;
  registeredUserId?: string;
  createdAt: string;
  expired: boolean;
}

export interface CreateStaffInvitationRequest {
  email: string;
  fullName?: string;
  phone?: string;
  role: Role;
  clinicId?: string;
  expiryDays?: number;
}

export interface StaffRegistrationRequest {
  token: string;
  invitationToken?: string;
  email: string;
  fullName: string;
  phone: string;
  password: string;
  address?: string;
  qualification?: string;
  specialization?: string;
  medicalRegistrationNumber?: string;
  stateCouncil?: string;
  experienceYears?: number;
  degreeCertificateUrl?: string;
  registrationCertificateUrl?: string;
  additionalCertificatesUrl?: string;
  therapistType?: string;
  therapySkills?: string[];
  trainingCertifications?: string;
  qualificationCertificateUrl?: string;
  trainingCertificateUrl?: string;
  idProofDocumentUrl?: string;
}

export interface StaffVerificationApplicationResponse {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  clinicId: string;
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  enabled: boolean;
  registeredAt: string;
  address?: string;
  qualification?: string;
  specialization?: string;
  medicalRegistrationNumber?: string;
  stateCouncil?: string;
  experienceYears?: number;
  therapistType?: string;
  therapySkills?: string[];
  trainingCertifications?: string;
  uploadedDocuments: Record<string, string>;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const createStaffInvitation = async (
  request: CreateStaffInvitationRequest
): Promise<StaffInvitationResponse> => {
  const res = await apiClient.post<ApiResponse<StaffInvitationResponse>>(
    "/staff-invitations",
    request
  );
  return res.data.data;
};

export const getAllStaffInvitations = async (
  role?: Role,
  status?: InvitationStatus,
  clinicId?: string
): Promise<StaffInvitationResponse[]> => {
  const params: Record<string, string> = {};
  if (role) params.role = role;
  if (status) params.status = status;
  if (clinicId) params.clinicId = clinicId;

  const res = await apiClient.get<ApiResponse<StaffInvitationResponse[]>>(
    "/staff-invitations",
    { params }
  );
  return res.data.data;
};

export const getInvitationByToken = async (
  token: string
): Promise<StaffInvitationResponse> => {
  const res = await apiClient.get<ApiResponse<StaffInvitationResponse>>(
    `/staff-invitations/token/${token}`
  );
  return res.data.data;
};

export const registerStaff = async (
  request: StaffRegistrationRequest
): Promise<string> => {
  const res = await apiClient.post<ApiResponse<string>>(
    "/staff-invitations/register",
    request
  );
  return res.data.message || res.data.data;
};

export const resendStaffInvitation = async (
  invitationId: string
): Promise<StaffInvitationResponse> => {
  const res = await apiClient.post<ApiResponse<StaffInvitationResponse>>(
    `/staff-invitations/${invitationId}/resend`
  );
  return res.data.data;
};

export const revokeStaffInvitation = async (
  invitationId: string
): Promise<StaffInvitationResponse> => {
  const res = await apiClient.post<ApiResponse<StaffInvitationResponse>>(
    `/staff-invitations/${invitationId}/revoke`
  );
  return res.data.data;
};

export const getPendingApplications = async (
  role?: Role,
  clinicId?: string
): Promise<StaffVerificationApplicationResponse[]> => {
  const params: Record<string, string> = {};
  if (role) params.role = role;
  if (clinicId) params.clinicId = clinicId;

  const res = await apiClient.get<ApiResponse<StaffVerificationApplicationResponse[]>>(
    "/staff-verification/pending",
    { params }
  );
  return res.data.data;
};

export const getAllApplications = async (
  role?: Role,
  status?: VerificationStatus,
  clinicId?: string
): Promise<StaffVerificationApplicationResponse[]> => {
  const params: Record<string, string> = {};
  if (role) params.role = role;
  if (status) params.status = status;
  if (clinicId) params.clinicId = clinicId;

  const res = await apiClient.get<ApiResponse<StaffVerificationApplicationResponse[]>>(
    "/staff-verification/all",
    { params }
  );
  return res.data.data;
};

export const getApplicationDetails = async (
  userId: string
): Promise<StaffVerificationApplicationResponse> => {
  const res = await apiClient.get<ApiResponse<StaffVerificationApplicationResponse>>(
    `/staff-verification/${userId}`
  );
  return res.data.data;
};

export const approveApplication = async (
  userId: string
): Promise<StaffVerificationApplicationResponse> => {
  const res = await apiClient.post<ApiResponse<StaffVerificationApplicationResponse>>(
    `/staff-verification/${userId}/approve`
  );
  return res.data.data;
};

export const rejectApplication = async (
  userId: string,
  reason: string
): Promise<StaffVerificationApplicationResponse> => {
  const res = await apiClient.post<ApiResponse<StaffVerificationApplicationResponse>>(
    `/staff-verification/${userId}/reject`,
    { reason }
  );
  return res.data.data;
};

export const suspendStaff = async (
  userId: string
): Promise<StaffVerificationApplicationResponse> => {
  const res = await apiClient.post<ApiResponse<StaffVerificationApplicationResponse>>(
    `/staff-verification/${userId}/suspend`
  );
  return res.data.data;
};

export const uploadDocument = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiClient.post<ApiResponse<{ documentUrl: string; fileName: string }>>(
    "/documents/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return res.data.data.documentUrl;
};

export const resolveDocumentUrl = (url: string | null | undefined): string => {
  if (!url) return "#";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  let cleanPath = url.startsWith("/") ? url : `/${url}`;
  if (!cleanPath.startsWith("/api/")) {
    cleanPath = `/api${cleanPath}`;
  }
  return `http://localhost:9999${cleanPath}`;
};
