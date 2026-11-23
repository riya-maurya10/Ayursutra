import apiClient from "../api/client";
import type {
  BaseUserProfile,
  DoctorProfile,
  TherapistProfile,
  ReceptionistProfile,
  PatientProfile,
  UpdateUserProfileRequest,
  UpdateDoctorProfileRequest,
  UpdateTherapistProfileRequest,
  UpdateReceptionistProfileRequest,
  UpdatePatientProfileRequest,
} from "../../types/profile";
import type { ApiResponse } from "../../types/auth";

// =========================================================
// AVATAR / PROFILE PICTURE UPLOAD WITH CLIENT VALIDATION
// =========================================================

const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export async function uploadProfilePicture(file: File): Promise<string> {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type.toLowerCase())) {
    throw new Error("Invalid image format. Only JPEG, PNG, and WebP images are supported.");
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    throw new Error("Image file size exceeds the 2MB limit. Please choose a smaller photo.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<ApiResponse<{ documentUrl: string }>>(
    "/documents/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  if (response.data && response.data.data && response.data.data.documentUrl) {
    return response.data.data.documentUrl;
  }

  throw new Error("Server did not return a valid profile picture URL.");
}

// =========================================================
// ADMIN & BASE USER PROFILE
// =========================================================

export async function getMyUserProfile(): Promise<BaseUserProfile> {
  const response = await apiClient.get<ApiResponse<BaseUserProfile>>("/users/me");
  return response.data.data;
}

export async function updateMyUserProfile(
  payload: UpdateUserProfileRequest
): Promise<BaseUserProfile> {
  const response = await apiClient.put<ApiResponse<BaseUserProfile>>("/users/me", payload);
  return response.data.data;
}

// =========================================================
// DOCTOR PROFILE
// =========================================================

export async function getMyDoctorProfile(): Promise<DoctorProfile> {
  const response = await apiClient.get<ApiResponse<DoctorProfile>>("/doctors/me");
  return response.data.data;
}

export async function updateMyDoctorProfile(
  payload: UpdateDoctorProfileRequest
): Promise<DoctorProfile> {
  const response = await apiClient.put<ApiResponse<DoctorProfile>>("/doctors/me", payload);
  return response.data.data;
}

// =========================================================
// THERAPIST PROFILE
// =========================================================

export async function getMyTherapistProfile(): Promise<TherapistProfile> {
  const response = await apiClient.get<ApiResponse<TherapistProfile>>("/therapists/me");
  return response.data.data;
}

export async function updateMyTherapistProfile(
  payload: UpdateTherapistProfileRequest
): Promise<TherapistProfile> {
  const response = await apiClient.put<ApiResponse<TherapistProfile>>("/therapists/me", payload);
  return response.data.data;
}

// =========================================================
// RECEPTIONIST PROFILE
// =========================================================

export async function getMyReceptionistProfile(): Promise<ReceptionistProfile> {
  const response = await apiClient.get<ApiResponse<ReceptionistProfile>>("/receptionists/me");
  return response.data.data;
}

export async function updateMyReceptionistProfile(
  payload: UpdateReceptionistProfileRequest
): Promise<ReceptionistProfile> {
  const response = await apiClient.put<ApiResponse<ReceptionistProfile>>("/receptionists/me", payload);
  return response.data.data;
}

// =========================================================
// PATIENT PROFILE
// =========================================================

export async function getMyPatientProfile(): Promise<PatientProfile> {
  const response = await apiClient.get<ApiResponse<PatientProfile>>("/patients/me");
  return response.data.data;
}

export async function updateMyPatientProfile(
  payload: UpdatePatientProfileRequest
): Promise<PatientProfile> {
  const response = await apiClient.put<ApiResponse<PatientProfile>>("/patients/me", payload);
  return response.data.data;
}
